import uuid
from django.db import models
from users.models import User


class Contract(models.Model):

    class Status(models.TextChoices):
        DRAFT      = "draft",      "Brouillon"
        PENDING    = "pending",    "En attente de signatures"
        SIGNED     = "signed",     "Signé par toutes les parties"
        CANCELLED  = "cancelled",  "Annulé"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_id  = models.UUIDField(unique=True)
    project_title = models.CharField(max_length=200)

    # Parties signataires
    volontaire  = models.ForeignKey(User, on_delete=models.PROTECT,
                                     related_name="contracts_as_volontaire",
                                     limit_choices_to={"role": User.Role.VOLONTAIRE})
    structure   = models.ForeignKey(User, on_delete=models.PROTECT,
                                     related_name="contracts_as_structure",
                                     limit_choices_to={"role": User.Role.STRUCTURE})
    admin       = models.ForeignKey(User, on_delete=models.PROTECT,
                                     related_name="contracts_as_admin",
                                     limit_choices_to={"role": User.Role.ADMIN})

    # Mécènes (N Mécènes peuvent co-financer)
    mecenes     = models.ManyToManyField(User, related_name="contracts_as_mecene",
                                          limit_choices_to={"role": User.Role.MECENE})

    status      = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)

    # Fichier PDF généré par WeasyPrint
    pdf_file    = models.FileField(upload_to="contracts/", null=True, blank=True)

    # Signatures (hash SHA256 du document signé + timestamp)
    signed_by_volontaire  = models.BooleanField(default=False)
    signed_by_structure   = models.BooleanField(default=False)
    signed_by_admin       = models.BooleanField(default=False)

    volontaire_signed_at  = models.DateTimeField(null=True, blank=True)
    structure_signed_at   = models.DateTimeField(null=True, blank=True)
    admin_signed_at       = models.DateTimeField(null=True, blank=True)

    # Hash d'intégrité du PDF
    document_hash         = models.CharField(max_length=64, blank=True,
                                              help_text="SHA256 du PDF généré")

    # Contenu du contrat
    total_budget          = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency              = models.CharField(max_length=3, default="EUR")
    duration_months       = models.PositiveIntegerField(default=36)
    platform_fee_percent  = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    co2_estimated_tons    = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    signed_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "contracts"

    def __str__(self):
        return f"Contrat {self.project_title} — {self.get_status_display()}"

    @property
    def all_signed(self):
        return all([
            self.signed_by_volontaire,
            self.signed_by_structure,
            self.signed_by_admin
        ])
