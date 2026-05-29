from django.contrib import admin
from .models import Proposal, ProposalDocument, ProposalPhoto


class ProposalDocumentInline(admin.TabularInline):
    model  = ProposalDocument
    extra  = 0
    fields = ("doc_type", "file", "is_verified", "verification_note")


class ProposalPhotoInline(admin.TabularInline):
    model  = ProposalPhoto
    extra  = 0
    fields = ("file", "exif_latitude", "exif_longitude", "gps_distance_meters", "gps_match")
    readonly_fields = ("exif_latitude", "exif_longitude", "gps_distance_meters", "gps_match")


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display  = ("title", "volontaire", "address_country", "surface_hectares",
                     "status", "created_at")
    list_filter   = ("status", "land_type", "address_country")
    search_fields = ("title", "volontaire__username", "address_full")
    readonly_fields = ("id", "nominatim_raw", "created_at", "updated_at")
    inlines       = [ProposalDocumentInline, ProposalPhotoInline]

    fieldsets = (
        ("Terrain", {"fields": ("id", "title", "description", "land_type",
                                "surface_hectares", "co2_estimated_tons")}),
        ("Localisation", {"fields": ("latitude", "longitude", "address_full",
                                     "address_country", "address_region",
                                     "address_city", "nominatim_raw")}),
        ("Workflow", {"fields": ("status", "volontaire", "admin_reviewer",
                                 "admin_review_note", "admin_reviewed_at",
                                 "structure_assigned", "site_visit_date",
                                 "site_visit_report", "surface_confirmed_hectares",
                                 "rejection_reason")}),
        ("Dates", {"fields": ("created_at", "updated_at", "approved_at")}),
    )
