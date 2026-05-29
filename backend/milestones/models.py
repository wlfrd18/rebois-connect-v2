import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User


class Milestone(models.Model):

    class Status(models.TextChoices):
        PENDING    = "pending",    "En attente"
        IN_PROGRESS = "in_progress", "En cours"
        SUBMITTED  = "submitted",  "Preuves soumises"
        VALIDATED  = "validated",  "Validé — paiement débloqué"
        REJECTED   = "rejected",   "Rejeté — preuves insuffisantes"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_id  = models.UUIDField()
    title       = models.CharField(max_length=200)
    description = models.TextField()
    order       = models.PositiveIntegerField(help_text="Ordre du milestone (1, 2, 3...)")

    # Pourcentage du budget total débloqué à ce milestone
    payment_percent = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )
    amount_to_release = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    status          = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    due_date        = models.DateField(null=True, blank=True)

    # Validation Admin
    validated_by    = models.ForeignKey(User, on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name="validated_milestones")
    validated_at    = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "milestones"
        ordering = ["order"]

    def __str__(self):
        return f"Milestone {self.order} — {self.title} ({self.get_status_display()})"


class MilestoneProof(models.Model):
    """Preuves uploadées par la Structure pour valider un milestone."""

    class ProofType(models.TextChoices):
        PHOTO       = "photo",      "Photo terrain"
        VIDEO       = "video",      "Vidéo"
        REPORT      = "report",     "Rapport technique"
        INVOICE     = "invoice",    "Facture"
        CERTIFICATE = "certificate","Certificat"
        OTHER       = "other",      "Autre"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    milestone   = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name="proofs")
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="uploaded_proofs")
    proof_type  = models.CharField(max_length=15, choices=ProofType.choices)
    file        = models.FileField(upload_to="milestone_proofs/")
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Vérification EXIF pour les photos
    exif_latitude  = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    exif_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    gps_match      = models.BooleanField(null=True, blank=True)

    class Meta:
        db_table = "milestone_proofs"

    def __str__(self):
        return f"Preuve {self.get_proof_type_display()} — {self.milestone.title}"
