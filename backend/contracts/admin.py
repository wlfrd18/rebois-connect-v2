from django.contrib import admin
from .models import Contract

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display  = ("project_title", "status", "all_signed", "total_budget", "created_at")
    list_filter   = ("status",)
    readonly_fields = ("id", "document_hash", "created_at", "signed_at")
    filter_horizontal = ("mecenes",)
