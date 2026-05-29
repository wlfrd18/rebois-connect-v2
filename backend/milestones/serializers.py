from rest_framework import serializers
from .models import Milestone, MilestoneProof


class MilestoneProofSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MilestoneProof
        fields = ("id", "proof_type", "file", "description", "uploaded_at",
                  "exif_latitude", "exif_longitude", "gps_match")
        read_only_fields = ("id", "uploaded_at", "exif_latitude", "exif_longitude", "gps_match")


class MilestoneSerializer(serializers.ModelSerializer):
    proofs         = MilestoneProofSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model  = Milestone
        fields = ("id", "project_id", "title", "description", "order",
                  "payment_percent", "amount_to_release", "status", "status_display",
                  "due_date", "validated_by", "validated_at", "rejection_reason",
                  "created_at", "proofs")
        read_only_fields = ("id", "created_at", "validated_by", "validated_at")
