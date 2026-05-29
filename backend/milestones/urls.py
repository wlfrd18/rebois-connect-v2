from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MilestoneViewSet, MilestoneProofUploadView

router = DefaultRouter()
router.register(r"", MilestoneViewSet, basename="milestone")

urlpatterns = [
    path("", include(router.urls)),
    path("<uuid:milestone_id>/proofs/", MilestoneProofUploadView.as_view()),
]
