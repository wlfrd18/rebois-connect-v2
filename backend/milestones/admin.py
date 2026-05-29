from django.contrib import admin
from .models import Milestone, MilestoneProof

class MilestoneProofInline(admin.TabularInline):
    model = MilestoneProof
    extra = 0
    readonly_fields = ("exif_latitude", "exif_longitude", "gps_match", "uploaded_at")

@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display  = ("title", "order", "payment_percent", "status", "due_date")
    list_filter   = ("status",)
    inlines       = [MilestoneProofInline]
    readonly_fields = ("id", "validated_at", "created_at", "updated_at")
