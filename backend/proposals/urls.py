from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProposalViewSet, ProposalDocumentUploadView, ProposalPhotoUploadView

router = DefaultRouter()
router.register(r"", ProposalViewSet, basename="proposal")

urlpatterns = [
    path("", include(router.urls)),
    path("<uuid:proposal_id>/documents/",
         ProposalDocumentUploadView.as_view(), name="proposal-document-upload"),
    path("<uuid:proposal_id>/photos/",
         ProposalPhotoUploadView.as_view(), name="proposal-photo-upload"),
]
