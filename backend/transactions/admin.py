from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display  = ("type", "amount", "currency", "status",
                     "authorized_by", "created_at")
    list_filter   = ("type", "status", "currency")
    search_fields = ("reference", "description")
    readonly_fields = ("id", "created_at", "completed_at")

    def has_change_permission(self, request, obj=None):
        """
        DevSecOps — Les transactions sont immuables.
        Personne ne peut les modifier depuis l'admin non plus.
        """
        return False

    def has_delete_permission(self, request, obj=None):
        return False
