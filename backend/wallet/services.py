"""
Services financiers — logique métier des transferts d'argent.

DevSecOps — principe de transaction atomique :
Toutes les opérations financières utilisent django.db.transaction.atomic().
Si une étape échoue, TOUT est annulé — on ne se retrouve jamais dans
un état incohérent (argent débité mais pas crédité, par exemple).
C'est l'équivalent du principe ACID en base de données.
"""
import uuid
from decimal import Decimal
from django.db import transaction as db_transaction
from django.utils import timezone
from .models import Wallet, EscrowAccount, MeceneCommitment
from transactions.models import Transaction


def confirm_mecene_payment(commitment_id: str, admin_user, ip_address: str = None):
    """
    Admin confirme la preuve de virement d'un Mécène.
    
    Étapes :
    1. Vérifie que le commitment existe et est en attente
    2. Crédite l'escrow du montant
    3. Met à jour le statut commitment → confirmed
    4. Crée une transaction immuable
    5. Tout ça en une seule transaction atomique
    """
    with db_transaction.atomic():
        commitment = MeceneCommitment.objects.select_for_update().get(
            id=commitment_id, status=MeceneCommitment.Status.PENDING
        )
        escrow = EscrowAccount.objects.select_for_update().get(
            id=commitment.escrow_id
        )

        # Créditer l'escrow
        escrow.funded_amount += commitment.amount
        escrow.locked_amount += commitment.amount
        if escrow.funded_amount >= escrow.total_amount:
            escrow.status    = EscrowAccount.Status.FUNDED
            escrow.funded_at = timezone.now()
        escrow.save()

        # Calculer la quote-part CO₂ de ce Mécène
        if escrow.total_amount > 0:
            commitment.co2_share_percent = (
                commitment.amount / escrow.total_amount * 100
            ).quantize(Decimal("0.01"))
        commitment.status       = MeceneCommitment.Status.CONFIRMED
        commitment.confirmed_at = timezone.now()
        commitment.payment_proof_verified    = True
        commitment.payment_proof_verified_by = admin_user
        commitment.save()

        # Créer la transaction immuable
        Transaction.objects.create(
            type        = Transaction.Type.MECENE_DEPOSIT,
            status      = Transaction.Status.COMPLETED,
            escrow      = escrow,
            amount      = commitment.amount,
            currency    = commitment.currency,
            description = f"Dépôt Mécène {commitment.mecene.username} — {escrow.project_title}",
            reference   = f"DEP-{uuid.uuid4().hex[:12].upper()}",
            authorized_by = admin_user,
            authorized_at = timezone.now(),
            ip_address  = ip_address,
            completed_at = timezone.now(),
        )

    return commitment


def release_milestone_payment(
    escrow_id: str,
    milestone_id: str,
    structure_wallet: Wallet,
    amount: Decimal,
    admin_user,
    ip_address: str = None
):
    """
    Admin débloque le paiement d'un milestone vers la Structure.
    
    Répartition automatique :
    - 80% → Wallet Structure technique
    - 20% → Commission Rebois Connect
    
    DevSecOps : select_for_update() verrouille les lignes en base
    pendant la transaction pour éviter les race conditions
    (deux admins qui valideraient le même milestone en même temps).
    """
    with db_transaction.atomic():
        escrow = EscrowAccount.objects.select_for_update().get(id=escrow_id)

        if escrow.locked_amount < amount:
            raise ValueError(
                f"Fonds insuffisants dans l'escrow : "
                f"{escrow.locked_amount} disponible, {amount} demandé."
            )

        # Calculer la commission (20%)
        fee_percent    = escrow.platform_fee_percent / 100
        platform_fee   = (amount * fee_percent).quantize(Decimal("0.01"))
        structure_amount = amount - platform_fee

        # Récupérer le wallet plateforme
        from users.models import User
        platform_user  = User.objects.get(role=User.Role.ADMIN, is_superuser=True)
        platform_wallet = Wallet.objects.get(user=platform_user)

        # Débiter l'escrow
        escrow.locked_amount   -= amount
        escrow.released_amount += amount
        escrow.save()

        # Créditer la Structure
        structure_wallet = Wallet.objects.select_for_update().get(
            id=structure_wallet.id
        )
        structure_wallet.balance += structure_amount
        structure_wallet.save()

        # Créditer la commission plateforme
        platform_wallet = Wallet.objects.select_for_update().get(
            id=platform_wallet.id
        )
        platform_wallet.balance += platform_fee
        platform_wallet.save()

        ref = f"MIL-{uuid.uuid4().hex[:12].upper()}"

        # Transaction Structure
        Transaction.objects.create(
            type         = Transaction.Type.MILESTONE_RELEASE,
            status       = Transaction.Status.COMPLETED,
            escrow       = escrow,
            to_wallet    = structure_wallet,
            amount       = structure_amount,
            currency     = escrow.currency,
            description  = f"Déblocage milestone — {escrow.project_title}",
            reference    = ref,
            milestone_id = milestone_id,
            authorized_by = admin_user,
            authorized_at = timezone.now(),
            ip_address   = ip_address,
            completed_at = timezone.now(),
        )

        # Transaction commission
        Transaction.objects.create(
            type         = Transaction.Type.PLATFORM_FEE,
            status       = Transaction.Status.COMPLETED,
            escrow       = escrow,
            to_wallet    = platform_wallet,
            amount       = platform_fee,
            currency     = escrow.currency,
            description  = f"Commission plateforme 20% — {escrow.project_title}",
            reference    = f"FEE-{uuid.uuid4().hex[:12].upper()}",
            milestone_id = milestone_id,
            authorized_by = admin_user,
            authorized_at = timezone.now(),
            ip_address   = ip_address,
            completed_at = timezone.now(),
        )

    return structure_amount, platform_fee
