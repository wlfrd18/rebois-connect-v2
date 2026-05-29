import uuid
from django.db import models
from users.models import User


class CO2Certificate(models.Model):
    """
    Certificat CO₂ émis pour un Mécène après validation du projet.
    
    Standard de certification visé : Verra VCS (mondial) ou Plan Vivo (Afrique/Asie)
    Phase MVP : certificat d'impact Rebois Connect (en attente certification officielle)
    
    DevSecOps : le certificat_hash garantit l'intégrité du document.
    Un certificat ne peut pas être falsifié — le hash permet de vérifier
    l'authenticité sur notre registre public.
    """

    class CertificationStandard(models.TextChoices):
        REBOIS_INTERNAL = "rebois_internal", "Certificat Rebois Connect (MVP)"
        LABEL_BAS_CARBONE = "label_bas_carbone", "Label Bas Carbone (France/Europe)"
        VERRA_VCS       = "verra_vcs",       "Verra VCS (Mondial)"
        GOLD_STANDARD   = "gold_standard",   "Gold Standard (International)"
        PLAN_VIVO       = "plan_vivo",       "Plan Vivo (Afrique/Asie)"

    class Status(models.TextChoices):
        PENDING  = "pending",  "En cours de génération"
        ISSUED   = "issued",   "Émis"
        REVOKED  = "revoked",  "Révoqué"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Numéro de série lisible (ex: RC-2026-00042)
    serial_number = models.CharField(max_length=30, unique=True)

    mecene      = models.ForeignKey(User, on_delete=models.PROTECT,
                                     related_name="certificates",
                                     limit_choices_to={"role": User.Role.MECENE})
    project_id  = models.UUIDField()
    project_title = models.CharField(max_length=200)
    contract    = models.ForeignKey("contracts.Contract", on_delete=models.PROTECT,
                                     related_name="certificates", null=True, blank=True)

    # Données CO₂
    co2_tons_certified = models.DecimalField(max_digits=10, decimal_places=2)
    co2_share_percent  = models.DecimalField(max_digits=5, decimal_places=2)
    investment_amount  = models.DecimalField(max_digits=12, decimal_places=2)
    currency           = models.CharField(max_length=3, default="EUR")

    # Localisation du projet
    project_country    = models.CharField(max_length=100)
    project_region     = models.CharField(max_length=100, blank=True)
    surface_hectares   = models.DecimalField(max_digits=10, decimal_places=2)

    # Période de séquestration
    start_date         = models.DateField()
    end_date           = models.DateField()

    # Certification
    standard           = models.CharField(max_length=25,
                                           choices=CertificationStandard.choices,
                                           default=CertificationStandard.REBOIS_INTERNAL)
    certification_body = models.CharField(max_length=200, blank=True,
                                           help_text="Organisme certificateur tiers")
    registry_reference = models.CharField(max_length=100, blank=True,
                                           help_text="Référence dans le registre officiel")

    # Fichier PDF
    pdf_file           = models.FileField(upload_to="certificates/", null=True, blank=True)
    certificate_hash   = models.CharField(max_length=64, blank=True,
                                           help_text="SHA256 — vérification d'authenticité")

    status      = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    issued_at   = models.DateTimeField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "co2_certificates"
        ordering = ["-issued_at"]

    def __str__(self):
        return f"{self.serial_number} — {self.mecene.username} — {self.co2_tons_certified}t CO₂"
