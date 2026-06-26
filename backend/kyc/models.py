import uuid
import boto3
from django.db import models
from django.core.files.storage import Storage
from django.conf import settings
from users.models import User


class KYCStorage(Storage):
    """Stockage privé dédié aux documents KYC — bucket séparé rebois-docs."""

    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=getattr(settings, "AWS_KYC_ACCESS_KEY_ID", settings.AWS_ACCESS_KEY_ID),
            aws_secret_access_key=getattr(settings, "AWS_KYC_SECRET_ACCESS_KEY", settings.AWS_SECRET_ACCESS_KEY),
        )
        self.bucket = getattr(settings, "AWS_KYC_BUCKET", settings.AWS_STORAGE_BUCKET_NAME)

    def _save(self, name, content):
        self.client.upload_fileobj(content, self.bucket, name)
        return name

    def url(self, name):
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": name},
            ExpiresIn=3600,
        )

    def exists(self, name):
        try:
            self.client.head_object(Bucket=self.bucket, Key=name)
            return True
        except:
            return False

    def delete(self, name):
        self.client.delete_object(Bucket=self.bucket, Key=name)

    def deconstruct(self):
        return ("kyc.models.KYCStorage", [], {})

def kyc_doc_path(instance, filename):
    return f"kyc/{instance.user.id}/{filename}"


class KYCDocument(models.Model):
    class DocType(models.TextChoices):
        ID_CARD   = "id_card",   "Carte d'identité"
        PASSPORT  = "passport",  "Passeport"
        RESIDENCE = "residence", "Justificatif de domicile"
        LAND_CERT = "land_cert", "Certificat foncier (Volontaire)"
        ORG_CERT  = "org_cert",  "Certificat d'organisation (Structure)"
        TAX_CERT  = "tax_cert",  "Attestation fiscale"
        OTHER     = "other",     "Autre"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name="kyc_documents")
    doc_type    = models.CharField(max_length=20, choices=DocType.choices)
    file        = models.FileField(upload_to=kyc_doc_path, storage=KYCStorage())
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "kyc_documents"

    def __str__(self):
        return f"KYC {self.get_doc_type_display()} — {self.user.username}"


class KYCReview(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name="kyc_review")
    reviewer    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="kyc_reviews_made")
    approved    = models.BooleanField()
    note        = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "kyc_reviews"
