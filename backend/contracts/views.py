from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.db import models
from django.utils import timezone
from users.permissions import IsAdmin
from rest_framework.permissions import IsAuthenticated
from .models import Contract
from .serializers import ContractSerializer
from .tasks import generate_contract_pdf


class ContractViewSet(ModelViewSet):
    serializer_class = ContractSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Contract.objects.all()
        return Contract.objects.filter(
            models.Q(volontaire=user) |
            models.Q(structure=user) |
            models.Q(mecenes=user)
        ).distinct()

    def get_permissions(self):
        if self.action == "create":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        contract = serializer.save(admin=self.request.user)
        generate_contract_pdf.delay(str(contract.id))

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def sign(self, request, pk=None):
        contract = self.get_object()
        user     = request.user

        if contract.status == Contract.Status.CANCELLED:
            return Response({"detail": "Contrat annulé."}, status=status.HTTP_400_BAD_REQUEST)

        if user == contract.volontaire:
            contract.signed_by_volontaire = True
            contract.volontaire_signed_at = timezone.now()
        elif user == contract.structure:
            contract.signed_by_structure  = True
            contract.structure_signed_at  = timezone.now()
        elif user == contract.admin:
            contract.signed_by_admin      = True
            contract.admin_signed_at      = timezone.now()
        else:
            return Response({"detail": "Vous n'êtes pas partie à ce contrat."},
                            status=status.HTTP_403_FORBIDDEN)

        if contract.all_signed:
            contract.status    = Contract.Status.SIGNED
            contract.signed_at = timezone.now()
        else:
            contract.status = Contract.Status.PENDING

        contract.save()
        return Response({"detail": "Signature enregistrée.",
                         "all_signed": contract.all_signed})

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def download(self, request, pk=None):
        contract = self.get_object()
        if not contract.pdf_file:
            return Response({"detail": "PDF non encore généré."},
                            status=status.HTTP_404_NOT_FOUND)
        return Response({"pdf_url": contract.pdf_file.url,
                         "document_hash": contract.document_hash})
