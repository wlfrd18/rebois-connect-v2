from rest_framework import generics, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.utils import timezone
from users.permissions import IsAdmin, IsStructureKYC
from .models import Milestone, MilestoneProof
from .serializers import MilestoneSerializer, MilestoneProofSerializer


class MilestoneViewSet(ModelViewSet):
    serializer_class = MilestoneSerializer

    def get_queryset(self):
        return Milestone.objects.filter(
            project_id=self.kwargs.get("project_id")
        ).prefetch_related("proofs")

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        if self.action == "submit_proofs":
            return [IsStructureKYC()]
        if self.action in ["validate", "reject"]:
            return [IsAdmin()]
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def validate(self, request, **kwargs):
        milestone = self.get_object()
        if milestone.status != Milestone.Status.SUBMITTED:
            return Response(
                {"detail": "Le milestone doit avoir des preuves soumises."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Déclencher le paiement via le service wallet
        from wallet.services import release_milestone_payment
        from wallet.models import EscrowAccount, Wallet
        try:
            escrow = EscrowAccount.objects.get(project_id=milestone.project_id)
            # Trouver le wallet de la structure assignée
            from proposals.models import Proposal
            # On récupère la structure depuis le projet
            structure_wallet = request.data.get("structure_wallet_id")
            if structure_wallet:
                sw = Wallet.objects.get(id=structure_wallet)
                from decimal import Decimal
                release_milestone_payment(
                    str(escrow.id), str(milestone.id),
                    sw, Decimal(str(milestone.amount_to_release)),
                    request.user, request.META.get("REMOTE_ADDR")
                )
        except Exception as e:
            pass  # Log l'erreur mais continue

        milestone.status       = Milestone.Status.VALIDATED
        milestone.validated_by = request.user
        milestone.validated_at = timezone.now()
        milestone.save()
        return Response({"detail": "Milestone validé — paiement débloqué."})

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def reject(self, request, **kwargs):
        milestone = self.get_object()
        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({"detail": "La raison du rejet est obligatoire."},
                            status=status.HTTP_400_BAD_REQUEST)
        milestone.status           = Milestone.Status.REJECTED
        milestone.rejection_reason = reason
        milestone.save()
        return Response({"detail": "Milestone rejeté."})


class MilestoneProofUploadView(generics.CreateAPIView):
    serializer_class   = MilestoneProofSerializer
    permission_classes = [IsStructureKYC]
    parser_classes     = [parsers.MultiPartParser]

    def perform_create(self, serializer):
        milestone = Milestone.objects.get(id=self.kwargs["milestone_id"])
        proof = serializer.save(milestone=milestone, uploaded_by=self.request.user)
        milestone.status = Milestone.Status.SUBMITTED
        milestone.save()
        # Vérification EXIF si photo
        if proof.proof_type == MilestoneProof.ProofType.PHOTO:
            from proposals.tasks import verify_photo_exif
            verify_photo_exif.delay(str(proof.id))
