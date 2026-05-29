from django.contrib import admin
from .models import CO2Certificate

@admin.register(CO2Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display  = ("serial_number", "mecene", "project_title", "co2_tons_certified",
                     "standard", "status", "issued_at")
    list_filter   = ("status", "standard", "project_country")
    search_fields = ("serial_number", "mecene__username", "project_title")
    readonly_fields = ("id", "certificate_hash", "created_at", "issued_at")

    def has_change_permission(self, request, obj=None):
        # Les certificats émis sont immuables
        if obj and obj.status == CO2Certificate.Status.ISSUED:
            return False
        return True
