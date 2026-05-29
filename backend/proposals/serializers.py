from rest_framework import serializers
from .models import Proposal, ProposalDocument, ProposalPhoto


class ProposalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProposalDocument
        fields = ("id", "doc_type", "file", "filename", "uploaded_at",
                  "is_verified", "verification_note")
        read_only_fields = ("id", "uploaded_at", "is_verified", "verification_note")


class ProposalPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProposalPhoto
        fields = ("id", "file", "exif_latitude", "exif_longitude",
                  "exif_taken_at", "gps_distance_meters", "gps_match", "uploaded_at")
        read_only_fields = ("id", "exif_latitude", "exif_longitude",
                            "exif_taken_at", "gps_distance_meters",
                            "gps_match", "uploaded_at")


class ProposalSerializer(serializers.ModelSerializer):
    documents = ProposalDocumentSerializer(many=True, read_only=True)
    photos    = ProposalPhotoSerializer(many=True, read_only=True)
    volontaire_username = serializers.CharField(
        source="volontaire.username", read_only=True
    )
    status_display   = serializers.CharField(source="get_status_display", read_only=True)
    land_type_display = serializers.CharField(source="get_land_type_display", read_only=True)
    surface_final    = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model  = Proposal
        fields = (
            "id", "volontaire", "volontaire_username",
            "title", "description", "land_type", "land_type_display",
            "surface_hectares", "surface_final",
            "latitude", "longitude",
            "address_full", "address_country", "address_region", "address_city",
            "status", "status_display",
            "co2_estimated_tons",
            "admin_review_note", "rejection_reason",
            "site_visit_date", "site_visit_report",
            "created_at", "updated_at", "approved_at",
            "documents", "photos",
        )
        read_only_fields = (
            "id", "volontaire", "status",
            "address_full", "address_country", "address_region", "address_city",
            "co2_estimated_tons", "admin_review_note", "rejection_reason",
            "site_visit_date", "site_visit_report",
            "created_at", "updated_at", "approved_at",
        )

    def validate_surface_hectares(self, value):
        if value < 0.5:
            raise serializers.ValidationError("La surface minimale est de 0.5 hectare.")
        if value > 10000:
            raise serializers.ValidationError("La surface maximale est de 10 000 hectares.")
        return value

    def validate(self, data):
        lat = data.get("latitude")
        lon = data.get("longitude")
        if lat is not None and lon is not None:
            if not (-90 <= float(lat) <= 90):
                raise serializers.ValidationError({"latitude": "Latitude invalide."})
            if not (-180 <= float(lon) <= 180):
                raise serializers.ValidationError({"longitude": "Longitude invalide."})
        return data


class ProposalCreateSerializer(ProposalSerializer):
    """Serializer pour la création — le Volontaire ne peut pas choisir le statut"""

    class Meta(ProposalSerializer.Meta):
        read_only_fields = ProposalSerializer.Meta.read_only_fields


class AdminProposalSerializer(ProposalSerializer):
    """Serializer Admin — champs supplémentaires visibles"""
    nominatim_raw = serializers.JSONField(read_only=True)

    class Meta(ProposalSerializer.Meta):
        fields = ProposalSerializer.Meta.fields + (
            "nominatim_raw", "admin_reviewer", "admin_reviewed_at",
            "structure_assigned", "structure_validated_at",
            "surface_confirmed_hectares",
        )
