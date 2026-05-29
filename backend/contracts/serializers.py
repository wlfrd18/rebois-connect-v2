from rest_framework import serializers
from .models import Contract


class ContractSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    all_signed     = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Contract
        fields = ("id", "project_id", "project_title", "volontaire", "structure",
                  "admin", "mecenes", "status", "status_display", "all_signed",
                  "pdf_file", "document_hash", "total_budget", "currency",
                  "duration_months", "platform_fee_percent", "co2_estimated_tons",
                  "signed_by_volontaire", "signed_by_structure", "signed_by_admin",
                  "volontaire_signed_at", "structure_signed_at", "admin_signed_at",
                  "created_at", "signed_at")
        read_only_fields = ("id", "admin", "pdf_file", "document_hash",
                            "signed_by_volontaire", "signed_by_structure",
                            "signed_by_admin", "signed_at", "created_at")
