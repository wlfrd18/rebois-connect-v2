from django.contrib import admin
from .models import Wallet, EscrowAccount, MeceneCommitment


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display  = ("user", "balance", "currency", "is_frozen", "updated_at")
    list_filter   = ("currency", "is_frozen")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(EscrowAccount)
class EscrowAdmin(admin.ModelAdmin):
    list_display  = ("project_title", "total_amount", "funded_amount",
                     "locked_amount", "status", "funding_progress_percent")
    list_filter   = ("status", "currency")
    readonly_fields = ("id", "created_at", "updated_at", "funded_at")


@admin.register(MeceneCommitment)
class MeceneCommitmentAdmin(admin.ModelAdmin):
    list_display  = ("mecene", "escrow", "amount", "status",
                     "payment_proof_verified", "committed_at")
    list_filter   = ("status", "payment_proof_verified")
    readonly_fields = ("id", "committed_at", "confirmed_at", "co2_share_percent")
