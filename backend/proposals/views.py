from rest_framework import generics, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from users.permissions import IsVolontaireKYC, IsAdmin
from .models import Proposal, ProposalDocument, ProposalPhoto
from .serializers import (
    ProposalSerializer, ProposalCreateSerializer,
    AdminProposalSerializer, ProposalDocumentSerializer, ProposalPhotoSerializer
)
from .tasks import geocode_proposal, verify_photo_exif
from .filters import ProposalFilter


class ProposalViewSet(ModelViewSet):
    """
    API principale pour les terrains.

    Volontaire : voit et gère ses propres terrains
    Admin      : voit tous les terrains, peut valider/rejeter
    Mécène     : voit uniquement les terrains approuvés (marketplace)
    """
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProposalFilter
    search_fields   = ["title", "address_country", "address_city", "address_region"]
    ordering_fields = ["created_at", "surface_hectares", "co2_estimated_tons"]
    ordering        = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Proposal.objects.all().select_related(
                "volontaire", "admin_reviewer", "structure_assigned"
            ).prefetch_related("documents", "photos")
        elif user.is_volontaire:
            return Proposal.objects.filter(volontaire=user).prefetch_related(
                "documents", "photos"
            )
        else:
            # Mécènes et Structures : marketplace uniquement
            return Proposal.objects.filter(
                status=Proposal.Status.APPROVED
            ).prefetch_related("documents", "photos")

    def get_serializer_class(self):
        if self.request.user.is_admin:
            return AdminProposalSerializer
        if self.action == "create":
            return ProposalCreateSerializer
        return ProposalSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsVolontaireKYC()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsVolontaireKYC()]
        if self.action in ["pre_validate", "reject", "assign_structure"]:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        proposal = serializer.save(
            volontaire=self.request.user,
            status=Proposal.Status.PENDING
        )
        # Lance le géocodage Nominatim en arrière-plan via Celery
        geocode_proposal.delay(str(proposal.id))

    def update(self, request, *args, **kwargs):
        proposal = self.get_object()
        # Un Volontaire ne peut modifier que ses brouillons ou terrains rejetés
        if proposal.volontaire != request.user:
            return Response(
                {"detail": "Vous ne pouvez modifier que vos propres terrains."},
                status=status.HTTP_403_FORBIDDEN
            )
        if proposal.status not in [Proposal.Status.DRAFT, Proposal.Status.REJECTED]:
            return Response(
                {"detail": "Ce terrain ne peut plus être modifié dans son état actuel."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)

    # ── Actions Admin ─────────────────────────────────────────

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def pre_validate(self, request, pk=None):
        """
        Étape 2 : Admin pré-valide après vérification des documents.
        Le terrain passe en status SITE_VISIT — une Structure sera assignée.
        """
        proposal = self.get_object()
        if proposal.status != Proposal.Status.PENDING:
            return Response(
                {"detail": "Seuls les terrains en attente peuvent être pré-validés."},
                status=status.HTTP_400_BAD_REQUEST
            )
        proposal.status           = Proposal.Status.PRE_VALIDATED
        proposal.admin_reviewer   = request.user
        proposal.admin_review_note = request.data.get("note", "")
        proposal.admin_reviewed_at = timezone.now()
        proposal.save()
        return Response({"detail": "Terrain pré-validé. Assigner une Structure technique."})

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        """Admin rejette un terrain avec une raison obligatoire."""
        proposal = self.get_object()
        reason   = request.data.get("reason", "").strip()
        if not reason:
            return Response(
                {"detail": "La raison du rejet est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST
            )
        proposal.status           = Proposal.Status.REJECTED
        proposal.rejection_reason = reason
        proposal.rejected_at      = timezone.now()
        proposal.admin_reviewer   = request.user
        proposal.admin_reviewed_at = timezone.now()
        proposal.save()
        return Response({"detail": "Terrain rejeté."})

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def assign_structure(self, request, pk=None):
        """Admin assigne une Structure technique pour la visite terrain."""
        from users.models import User as UserModel
        proposal     = self.get_object()
        structure_id = request.data.get("structure_id")
        try:
            structure = UserModel.objects.get(id=structure_id, role=UserModel.Role.STRUCTURE)
        except UserModel.DoesNotExist:
            return Response(
                {"detail": "Structure introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        proposal.structure_assigned = structure
        proposal.status             = Proposal.Status.SITE_VISIT
        proposal.save()
        return Response({"detail": f"Structure {structure.username} assignée."})

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        """
        Étape finale : Admin approuve après rapport de visite terrain.
        Le terrain entre dans la marketplace.
        """
        proposal = self.get_object()
        if proposal.status != Proposal.Status.SITE_VISIT:
            return Response(
                {"detail": "Le terrain doit avoir une visite terrain confirmée."},
                status=status.HTTP_400_BAD_REQUEST
            )
        proposal.status      = Proposal.Status.APPROVED
        proposal.approved_at = timezone.now()
        proposal.save()
        return Response({"detail": "Terrain approuvé et visible en marketplace."})


class ProposalDocumentUploadView(generics.CreateAPIView):
    """Upload d'un document de propriété pour un terrain."""
    serializer_class   = ProposalDocumentSerializer
    permission_classes = [IsVolontaireKYC]
    parser_classes     = [parsers.MultiPartParser]

    def perform_create(self, serializer):
        proposal = Proposal.objects.get(
            id=self.kwargs["proposal_id"],
            volontaire=self.request.user
        )
        filename = self.request.FILES["file"].name
        serializer.save(proposal=proposal, filename=filename)


class ProposalPhotoUploadView(generics.CreateAPIView):
    """Upload d'une photo géolocalisée pour un terrain."""
    serializer_class   = ProposalPhotoSerializer
    permission_classes = [IsVolontaireKYC]
    parser_classes     = [parsers.MultiPartParser]

    def perform_create(self, serializer):
        proposal = Proposal.objects.get(
            id=self.kwargs["proposal_id"],
            volontaire=self.request.user
        )
        photo = serializer.save(proposal=proposal)
        # Lance la vérification EXIF en arrière-plan
        verify_photo_exif.delay(str(photo.id))
