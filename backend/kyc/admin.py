from django.contrib import admin
from .models import KYCDocument, KYCReview

@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display  = ("user", "doc_type", "uploaded_at")
    list_filter   = ("doc_type",)
    readonly_fields = ("id", "uploaded_at")

@admin.register(KYCReview)
class KYCReviewAdmin(admin.ModelAdmin):
    list_display  = ("user", "approved", "reviewer", "reviewed_at")
    readonly_fields = ("id", "reviewed_at")
