import uuid
from django.db import models
from django.core.validators import MinValueValidator
from users.models import User


class Wallet(models.Model):
    """
    Portefeuille de chaque utilisateur.
    
    - Mécène    : solde disponible pour sponsoriser des projets
    - Structure : solde reçu après déblocage des milestones
    - Plateforme: compte spécial pour les commissions Rebois Connect
    
    DevSecOps : on ne stocke jamais de données bancaires ici.
    Ce wallet représente un solde comptable interne à la plateforme.
    Les vrais virements bancaires passent par un prestataire de paiement
    externe (Stripe, CinetPay pour l'Afrique) — jamais géré par nous.
    """

    class Currency(models.TextChoices):
        EUR = "EUR", "Euro"
        XAF = "XAF", "Franc CFA (CEMAC)"
        XOF = "XOF", "Franc CFA (UEMOA)"
        USD = "USD", "Dollar américain"

    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user     = models.OneToOneField(User, on_delete=models.PROTECT, related_name="wallet")
    balance  = models.DecimalField(
        max_digits=12, decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    currency = models.CharField(max_length=3, choices=Currency.choices, default=Currency.EUR)
    is_frozen = models.BooleanField(default=False,
                                    help_text="Wallet gelé par Admin (fraude suspectée)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "wallets"

    def __str__(self):
        return f"Wallet {self.user.username} — {self.balance} {self.currency}"

    def can_spend(self, amount):
        """Vérifie si le wallet peut dépenser ce montant"""
        return not self.is_frozen and self.balance >= amount


class EscrowAccount(models.Model):
    """
    Compte séquestre par projet.
    
    L'argent du Mécène est bloqué ici dès le virement.
    Il ne peut être libéré que par validation Admin des milestones.
    
    DevSecOps : séparation des fonds — l'argent de chaque projet
    est isolé. Une erreur sur un projet n'affecte pas les autres.
    """

    class Status(models.TextChoices):
        AWAITING_FUNDS  = "awaiting_funds",  "En attente de fonds"
        FUNDED          = "funded",          "Financé — travaux non démarrés"
        IN_PROGRESS     = "in_progress",     "Travaux en cours"
        COMPLETED       = "completed",       "Projet terminé"
        DISPUTED        = "disputed",        "Litige en cours"
        REFUNDED        = "refunded",        "Remboursé"

    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Lien vers le projet (on le connectera au module projects plus tard)
    project_id   = models.UUIDField(unique=True,
                                     help_text="ID du projet associé")
    project_title = models.CharField(max_length=200)

    # Montant total attendu (somme des engagements Mécènes)
    total_amount    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Montant effectivement reçu
    funded_amount   = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Montant déjà débloqué (milestones validés)
    released_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Montant restant bloqué
    locked_amount   = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    currency = models.CharField(max_length=3, default="EUR")
    status   = models.CharField(max_length=20, choices=Status.choices,
                                 default=Status.AWAITING_FUNDS)

    # Commission plateforme (% prélevé sur chaque déblocage)
    platform_fee_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=20.00,
        help_text="% de commission Rebois Connect (défaut 20%)"
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    funded_at   = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "escrow_accounts"

    def __str__(self):
        return f"Escrow {self.project_title} — {self.locked_amount}/{self.total_amount}"

    @property
    def funding_progress_percent(self):
        """Pourcentage de financement atteint"""
        if self.total_amount == 0:
            return 0
        return round(float(self.funded_amount) / float(self.total_amount) * 100, 1)

    @property
    def is_fully_funded(self):
        return self.funded_amount >= self.total_amount


class MeceneCommitment(models.Model):
    """
    Engagement financier d'un Mécène sur un projet.
    
    Un projet peut avoir N Mécènes (crowdfunding).
    Chaque Mécène reçoit des certificats CO₂ proportionnels
    à sa quote-part du financement total.
    """

    class Status(models.TextChoices):
        PENDING   = "pending",   "En attente de virement"
        CONFIRMED = "confirmed", "Virement confirmé"
        CANCELLED = "cancelled", "Annulé"
        REFUNDED  = "refunded",  "Remboursé"

    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mecene  = models.ForeignKey(User, on_delete=models.PROTECT,
                                related_name="commitments",
                                limit_choices_to={"role": User.Role.MECENE})
    escrow  = models.ForeignKey(EscrowAccount, on_delete=models.PROTECT,
                                related_name="commitments")
    amount  = models.DecimalField(max_digits=12, decimal_places=2,
                                   validators=[MinValueValidator(100)])
    currency = models.CharField(max_length=3, default="EUR")
    status   = models.CharField(max_length=15, choices=Status.choices,
                                 default=Status.PENDING)

    # Preuve de virement uploadée par le Mécène
    payment_proof = models.FileField(
        upload_to="payment_proofs/",
        null=True, blank=True,
        help_text="Capture d'écran ou relevé bancaire du virement"
    )
    payment_proof_verified = models.BooleanField(default=False)
    payment_proof_verified_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="verified_payments"
    )

    # Quote-part CO₂
    co2_share_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="% du financement total = % des crédits CO₂"
    )
    co2_tons_allocated = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Tonnes CO₂ allouées à ce Mécène"
    )

    committed_at  = models.DateTimeField(auto_now_add=True)
    confirmed_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "mecene_commitments"
        unique_together = [["mecene", "escrow"]]

    def __str__(self):
        return f"{self.mecene.username} → {self.amount} {self.currency} ({self.get_status_display()})"
