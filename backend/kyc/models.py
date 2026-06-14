import uuid
from django.db import models
from users.models import User


def kyc_doc_path(instance, filename):
    return f"kyc/{instance.user.id}/{filename}"


class KYCDocument(models.Model):

    class DocType(models.TextChoices):
        ID_CARD       = "id_card",       "Carte d'identité"
        PASSPORT      = "passport",      "Passeport"
        RESIDENCE     = "residence",     "Justificatif de domicile"
        LAND_CERT     = "land_cert",     "Certificat foncier (Volontaire)"
        ORG_CERT      = "org_cert",      "Certificat d'organisation (Structure)"
        TAX_CERT      = "tax_cert",      "Attestation fiscale"
        OTHER         = "other",         "Autre"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name="kyc_documents")
    doc_type    = models.CharField(max_length=20, choices=DocType.choices)
    file        = models.FileField(upload_to=kyc_doc_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "kyc_documents"

    def __str__(self):
        return f"KYC {self.get_doc_type_display()} — {self.user.username}"


class KYCReview(models.Model):
    """Enregistrement de la décision Admin sur un KYC."""

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name="kyc_review")
    reviewer    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                     related_name="kyc_reviews_made")
    approved    = models.BooleanField()
    note        = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "kyc_reviews"
