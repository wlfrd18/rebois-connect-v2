from django.test import TestCase
from rest_framework.test import APIClient
from decimal import Decimal
from users.models import User
from wallet.models import Wallet, EscrowAccount, MeceneCommitment
from transactions.models import Transaction
from wallet.services import confirm_mecene_payment, release_milestone_payment
import uuid


def create_user(email, username, role):
    user = User.objects.create_user(
        email=email, username=username,
        role=role, password="SecurePass2024!"
    )
    user.kyc_status = User.KYCStatus.APPROVED
    user.save()
    Wallet.objects.create(user=user, balance=Decimal("0"), currency="EUR")
    return user


class WalletServiceTest(TestCase):
    """
    Tests des services financiers.
    On teste l'atomicité et l'immutabilité — les deux principes
    DevSecOps les plus importants pour un système financier.
    """

    def setUp(self):
        self.admin     = User.objects.create_superuser(
            email="admin@test.com", username="admin1", password="SecurePass2024!"
        )
        Wallet.objects.create(user=self.admin, balance=Decimal("0"), currency="EUR")

        self.mecene    = create_user("mec@test.com",  "mecene1",    "mecene")
        self.structure = create_user("str@test.com",  "structure1", "structure")

        self.escrow = EscrowAccount.objects.create(
            project_id    = uuid.uuid4(),
            project_title = "Reforestation Cameroun",
            total_amount  = Decimal("10000.00"),
            currency      = "EUR",
        )

    def test_confirm_payment_credits_escrow(self):
        """
        Quand l'Admin confirme un virement Mécène,
        l'escrow est crédité du bon montant.
        """
        commitment = MeceneCommitment.objects.create(
            mecene   = self.mecene,
            escrow   = self.escrow,
            amount   = Decimal("5000.00"),
            currency = "EUR",
        )
        confirm_mecene_payment(str(commitment.id), self.admin)
        self.escrow.refresh_from_db()
        self.assertEqual(self.escrow.funded_amount, Decimal("5000.00"))
        self.assertEqual(self.escrow.locked_amount, Decimal("5000.00"))

    def test_confirm_payment_creates_transaction(self):
        """Chaque paiement confirmé crée une transaction immuable."""
        commitment = MeceneCommitment.objects.create(
            mecene   = self.mecene,
            escrow   = self.escrow,
            amount   = Decimal("3000.00"),
            currency = "EUR",
        )
        confirm_mecene_payment(str(commitment.id), self.admin)
        tx = Transaction.objects.filter(
            type   = Transaction.Type.MECENE_DEPOSIT,
            escrow = self.escrow,
            amount = Decimal("3000.00")
        )
        self.assertTrue(tx.exists())
        self.assertEqual(tx.first().status, Transaction.Status.COMPLETED)

    def test_co2_share_calculated(self):
        """
        La quote-part CO₂ est calculée automatiquement.
        Mécène investit 5000 sur 10000 total = 50% des crédits CO₂.
        """
        commitment = MeceneCommitment.objects.create(
            mecene   = self.mecene,
            escrow   = self.escrow,
            amount   = Decimal("5000.00"),
            currency = "EUR",
        )
        confirm_mecene_payment(str(commitment.id), self.admin)
        commitment.refresh_from_db()
        self.assertEqual(commitment.co2_share_percent, Decimal("50.00"))

    def test_transaction_immutability(self):
        """
        SÉCURITÉ — Immutabilité : une transaction complétée
        ne peut pas être modifiée. C'est le principe d'audit trail.
        """
        commitment = MeceneCommitment.objects.create(
            mecene   = self.mecene,
            escrow   = self.escrow,
            amount   = Decimal("1000.00"),
            currency = "EUR",
        )
        confirm_mecene_payment(str(commitment.id), self.admin)
        tx = Transaction.objects.get(
            type=Transaction.Type.MECENE_DEPOSIT,
            escrow=self.escrow
        )
        tx.amount = Decimal("9999.00")
        with self.assertRaises(ValueError):
            tx.save()

    def test_release_milestone_splits_correctly(self):
        """
        Le déblocage d'un milestone répartit correctement :
        80% Structure + 20% commission plateforme.
        """
        # D'abord créditer l'escrow
        commitment = MeceneCommitment.objects.create(
            mecene=self.mecene, escrow=self.escrow,
            amount=Decimal("10000.00"), currency="EUR",
        )
        confirm_mecene_payment(str(commitment.id), self.admin)

        structure_wallet = Wallet.objects.get(user=self.structure)
        admin_wallet     = Wallet.objects.get(user=self.admin)

        structure_amount, platform_fee = release_milestone_payment(
            str(self.escrow.id),
            str(uuid.uuid4()),
            structure_wallet,
            Decimal("1000.00"),
            self.admin
        )

        self.assertEqual(structure_amount, Decimal("800.00"))
        self.assertEqual(platform_fee,     Decimal("200.00"))

        structure_wallet.refresh_from_db()
        admin_wallet.refresh_from_db()
        self.assertEqual(structure_wallet.balance, Decimal("800.00"))
        self.assertEqual(admin_wallet.balance,     Decimal("200.00"))

    def test_release_fails_if_insufficient_funds(self):
        """
        SÉCURITÉ : On ne peut pas débloquer plus que ce qu'il y a
        dans l'escrow. Protection contre les erreurs et la fraude.
        """
        structure_wallet = Wallet.objects.get(user=self.structure)
        with self.assertRaises(ValueError):
            release_milestone_payment(
                str(self.escrow.id),
                str(uuid.uuid4()),
                structure_wallet,
                Decimal("99999.00"),  # Bien plus que le solde
                self.admin
            )

    def test_frozen_wallet_check(self):
        """Un wallet gelé par Admin ne peut pas effectuer de transactions."""
        wallet = Wallet.objects.get(user=self.mecene)
        wallet.balance   = Decimal("5000.00")
        wallet.is_frozen = True
        wallet.save()
        self.assertFalse(wallet.can_spend(Decimal("100.00")))

    def test_double_confirmation_blocked(self):
        """
        SÉCURITÉ : Un virement déjà confirmé ne peut pas
        être confirmé une deuxième fois.
        """
        commitment = MeceneCommitment.objects.create(
            mecene=self.mecene, escrow=self.escrow,
            amount=Decimal("2000.00"), currency="EUR",
        )
        confirm_mecene_payment(str(commitment.id), self.admin)
        with self.assertRaises(Exception):
            confirm_mecene_payment(str(commitment.id), self.admin)
