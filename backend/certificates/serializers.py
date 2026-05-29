from rest_framework import serializers
from .models import CO2Certificate


class CertificateSerializer(serializers.ModelSerializer):
    mecene_name    = serializers.CharField(source="mecene.username", read_only=True)
    standard_display = serializers.CharField(source="get_standard_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model  = CO2Certificate
        fields = ("id", "serial_number", "mecene", "mecene_name",
                  "project_title", "project_country",
                  "co2_tons_certified", "co2_share_percent",
                  "investment_amount", "currency",
                  "surface_hectares", "start_date", "end_date",
                  "standard", "standard_display", "status", "status_display",
                  "pdf_file", "certificate_hash", "issued_at", "registry_reference")
        read_only_fields = fields
