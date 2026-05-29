import uuid
from django.db import models
from users.models import User
from wallet.models import Wallet, EscrowAccount


class Transaction(models.Model):
    """
    Trace immuable de chaque mouvement d'argent sur la plateforme.
    
    DevSecOps — principe d'audit trail :
    Chaque transaction est créée une seule fois et ne peut jamais
    être modifiée ni supprimée. C'est la garantie de traçabilité
    financière. En cas de litige, on peut reconstituer l'historique
    complet de chaque centime.
    
    C'est équivalent aux logs d'audit en sécurité informatique —
    on ne modifie jamais un log, on ajoute.
    """

    class Type(models.TextChoices):
        # Mécène → Escrow
        MECENE_DEPOSIT      = "mecene_deposit",     "Dépôt Mécène → Escrow"
        # Escrow → Structure (milestone validé)
        MILESTONE_RELEASE   = "milestone_release",  "Déblocage milestone → Structure"
        # Escrow → Commission Rebois Connect
        PLATFORM_FEE        = "platform_fee",       "Commission plateforme"
        # Remboursement si projet annulé
        REFUND              = "refund",             "Remboursement Mécène"
        # Retrait Structure vers banque
        WITHDRAWAL          = "withdrawal",         "Retrait vers compte bancaire"

    class Status(models.TextChoices):
        PENDING   = "pending",   "En attente"
        COMPLETED = "completed", "Complétée"
        FAILED    = "failed",    "Échouée"
        CANCELLED = "cancelled", "Annulée"

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type        = models.CharField(max_length=25, choices=Type.choices)
    status      = models.CharField(max_length=15, choices=Status.choices,
                                    default=Status.PENDING)

    # Qui envoie, qui reçoit
    from_wallet = models.ForeignKey(Wallet, on_delete=models.PROTECT,
                                     null=True, blank=True,
                                     related_name="sent_transactions")
    to_wallet   = models.ForeignKey(Wallet, on_delete=models.PROTECT,
                                     null=True, blank=True,
                                     related_name="received_transactions")
    escrow      = models.ForeignKey(EscrowAccount, on_delete=models.PROTECT,
                                     null=True, blank=True,
                                     related_name="transactions")

    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    currency    = models.CharField(max_length=3, default="EUR")

    # Contexte
    description     = models.TextField(blank=True)
    reference       = models.CharField(max_length=100, unique=True,
                                        help_text="Référence unique de la transaction")
    milestone_id    = models.UUIDField(null=True, blank=True,
                                        help_text="Milestone associé si déblocage")

    # Qui a autorisé (Admin pour les déblocages)
    authorized_by   = models.ForeignKey(User, on_delete=models.PROTECT,
                                         null=True, blank=True,
                                         related_name="authorized_transactions")
    authorized_at   = models.DateTimeField(null=True, blank=True)

    # Métadonnées
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "transactions"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["type", "status"]),
            models.Index(fields=["escrow"]),
            models.Index(fields=["from_wallet"]),
            models.Index(fields=["to_wallet"]),
        ]

    def __str__(self):
        return f"{self.get_type_display()} — {self.amount} {self.currency} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        """
        DevSecOps — Immutabilité des transactions :
        Une transaction complétée ou échouée ne peut plus être modifiée.
        """
        if self.pk:
            original = Transaction.objects.filter(pk=self.pk).first()
            if original and original.status in [self.Status.COMPLETED, self.Status.FAILED]:
                raise ValueError(
                    f"Transaction {self.pk} est finalisée et ne peut pas être modifiée."
                )
        super().save(*args, **kwargs)
