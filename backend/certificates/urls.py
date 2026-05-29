from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CertificateViewSet
from django.urls import include

router = DefaultRouter()
router.register(r"", CertificateViewSet, basename="certificate")
urlpatterns = [path("", include(router.urls))]
