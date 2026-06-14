from rest_framework import serializers
from django.conf import settings
from .models import KYCDocument, KYCReview


class KYCDocumentSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.CharField(source="get_doc_type_display", read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model  = KYCDocument
        fields = ("id", "doc_type", "doc_type_display", "file", "file_url", "uploaded_at")
        read_only_fields = ("id", "uploaded_at")

    def get_file_url(self, obj):
        if not obj.file:
            return None
        # Remplace l'URL interne minio par l'URL publique
        url = obj.file.url
        minio_internal = f"http://minio:9000"
        minio_public   = getattr(settings, "MINIO_PUBLIC_URL", "http://192.168.56.102:9000")
        return url.replace(minio_internal, minio_public)


class KYCReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model  = KYCReview
        fields = ("id", "approved", "note", "reviewed_at")
