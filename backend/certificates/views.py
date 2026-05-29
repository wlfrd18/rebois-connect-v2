from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CO2Certificate
from .serializers import CertificateSerializer


class CertificateViewSet(ReadOnlyModelViewSet):
    serializer_class   = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return CO2Certificate.objects.all().select_related("mecene")
        return CO2Certificate.objects.filter(mecene=user).select_related("mecene")

    @action(detail=True, methods=["get"])
    def verify(self, request, pk=None):
        """Vérifie l'authenticité d'un certificat via son hash."""
        cert = self.get_object()
        return Response({
            "serial_number":    cert.serial_number,
            "document_hash":    cert.certificate_hash,
            "status":           cert.status,
            "issued_at":        cert.issued_at,
            "co2_tons":         cert.co2_tons_certified,
            "standard":         cert.get_standard_display(),
            "authentic":        bool(cert.certificate_hash),
        })
