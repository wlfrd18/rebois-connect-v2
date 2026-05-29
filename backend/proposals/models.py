import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User


def proposal_document_path(instance, filename):
    """Stocke les documents dans MinIO sous proposals/{uuid}/{filename}"""
    return f"proposals/{instance.id}/documents/{filename}"

def proposal_photo_path(instance, filename):
    return f"proposals/{instance.proposal.id}/photos/{filename}"


class Proposal(models.Model):

    class Status(models.TextChoices):
        DRAFT           = "draft",            "Brouillon"
        PENDING         = "pending",          "En attente de validation"
        PRE_VALIDATED   = "pre_validated",    "Pré-validé (Admin)"
        SITE_VISIT      = "site_visit",       "Visite terrain en cours"
        APPROVED        = "approved",         "Approuvé — en marketplace"
        REJECTED        = "rejected",         "Rejeté"
        SUSPENDED       = "suspended",        "Suspendu"

    class LandType(models.TextChoices):
        DEGRADED_FOREST = "degraded_forest",  "Forêt dégradée"
        SAVANNA         = "savanna",          "Savane"
        AGRICULTURAL    = "agricultural",     "Terrain agricole abandonné"
        BARE_LAND       = "bare_land",        "Terrain nu"
        RIPARIAN        = "riparian",         "Zone riparienne (bord de cours d'eau)"
        OTHER           = "other",            "Autre"

    class DocumentType(models.TextChoices):
        TITLE_DEED      = "title_deed",       "Titre foncier"
        SALE_ACT        = "sale_act",         "Acte de vente"
        CUSTOMARY_CERT  = "customary_cert",   "Certificat coutumier"
        DONATION_ACT    = "donation_act",     "Acte de donation"
        OTHER           = "other",            "Autre document"

    # ── Identité ──────────────────────────────────────────────
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volontaire  = models.ForeignKey(
        User, on_delete=models.PROTECT,
        related_name="proposals",
        limit_choices_to={"role": User.Role.VOLONTAIRE}
    )

    # ── Description du terrain ────────────────────────────────
    title           = models.CharField(max_length=200)
    description     = models.TextField()
    land_type       = models.CharField(max_length=30, choices=LandType.choices)
    surface_hectares = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(0.5)],  # minimum 0.5 hectare
        help_text="Surface approximative déclarée par le Volontaire"
    )

    # ── Localisation GPS (point central) ─────────────────────
    latitude    = models.DecimalField(
        max_digits=9, decimal_places=6,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude   = models.DecimalField(
        max_digits=9, decimal_places=6,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )

    # ── Adresse récupérée via Nominatim ───────────────────────
    # Rempli automatiquement par Celery après soumission
    address_full    = models.TextField(blank=True)
    address_country = models.CharField(max_length=100, blank=True)
    address_region  = models.CharField(max_length=100, blank=True)
    address_city    = models.CharField(max_length=100, blank=True)
    nominatim_raw   = models.JSONField(default=dict, blank=True,
                                       help_text="Réponse brute Nominatim")

    # ── Statut et workflow ────────────────────────────────────
    status          = models.CharField(
        max_length=20, choices=Status.choices,
        default=Status.DRAFT
    )

    # ── Validation Admin (étape 2) ────────────────────────────
    admin_reviewer  = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="reviewed_proposals",
        limit_choices_to={"role": User.Role.ADMIN}
    )
    admin_review_note   = models.TextField(blank=True)
    admin_reviewed_at   = models.DateTimeField(null=True, blank=True)

    # ── Visite terrain Structure (étape 3) ───────────────────
    structure_assigned  = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="assigned_proposals",
        limit_choices_to={"role": User.Role.STRUCTURE}
    )
    site_visit_date     = models.DateField(null=True, blank=True)
    site_visit_report   = models.TextField(blank=True)
    # Surface confirmée par la Structure (peut différer du déclaré)
    surface_confirmed_hectares = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True
    )
    structure_validated_at = models.DateTimeField(null=True, blank=True)

    # ── Rejet ─────────────────────────────────────────────────
    rejection_reason = models.TextField(blank=True)
    rejected_at      = models.DateTimeField(null=True, blank=True)

    # ── CO₂ estimé (calculé après validation Structure) ──────
    # Basé sur : surface × espèces prévues × taux séquestration Label Bas Carbone
    co2_estimated_tons = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        help_text="Tonnes CO₂ séquestrées estimées sur 30 ans"
    )

    # ── Timestamps ────────────────────────────────────────────
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "proposals"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["status"]),
            models.Index(fields=["volontaire"]),
            models.Index(fields=["address_country"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.get_status_display()}"

    @property
    def surface_final(self):
        """Surface confirmée par la Structure, sinon déclarée par le Volontaire"""
        return self.surface_confirmed_hectares or self.surface_hectares

    @property
    def gps_coords(self):
        return {"latitude": float(self.latitude), "longitude": float(self.longitude)}


class ProposalDocument(models.Model):
    """Documents de propriété uploadés par le Volontaire"""

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal    = models.ForeignKey(Proposal, on_delete=models.CASCADE,
                                    related_name="documents")
    doc_type    = models.CharField(max_length=20, choices=Proposal.DocumentType.choices)
    file        = models.FileField(upload_to=proposal_document_path)
    filename    = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Vérification Admin
    is_verified     = models.BooleanField(default=False)
    verified_by     = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="verified_documents"
    )
    verified_at     = models.DateTimeField(null=True, blank=True)
    verification_note = models.TextField(blank=True)

    class Meta:
        db_table = "proposal_documents"

    def __str__(self):
        return f"{self.get_doc_type_display()} — {self.proposal.title}"


class ProposalPhoto(models.Model):
    """
    Photos géolocalisées prises sur le terrain par le Volontaire.
    On vérifie les métadonnées EXIF pour confirmer que la photo
    a bien été prise aux coordonnées du terrain déclaré.
    """

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal    = models.ForeignKey(Proposal, on_delete=models.CASCADE,
                                    related_name="photos")
    file        = models.ImageField(upload_to=proposal_photo_path)

    # Coordonnées extraites des métadonnées EXIF de la photo
    exif_latitude   = models.DecimalField(max_digits=9, decimal_places=6,
                                           null=True, blank=True)
    exif_longitude  = models.DecimalField(max_digits=9, decimal_places=6,
                                           null=True, blank=True)
    exif_taken_at   = models.DateTimeField(null=True, blank=True)

    # Résultat de la vérification EXIF
    # Distance en mètres entre le GPS de la photo et le GPS déclaré du terrain
    gps_distance_meters = models.IntegerField(null=True, blank=True)
    exif_verified       = models.BooleanField(default=False)
    # True si la photo a bien été prise à moins de 500m du terrain déclaré
    gps_match           = models.BooleanField(null=True, blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "proposal_photos"

    def __str__(self):
        match = "✓ GPS OK" if self.gps_match else "✗ GPS KO"
        return f"Photo {self.proposal.title} — {match}"
