from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

admin.site.site_header = "Rebois Connect — Administration"

urlpatterns = [
    # Admin sur URL secrète
    path(f"{settings.ADMIN_URL}/", admin.site.urls),

    # ── Documentation API ─────────────────────────────────────
    # Schema JSON/YAML brut (utilisé par Swagger et Redoc)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    # Interface Swagger UI interactive
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # Interface Redoc (alternative plus lisible)
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # ── API versionnée ────────────────────────────────────────
    path("api/v1/auth/",         include("users.urls")),
    path("api/v1/kyc/",          include("kyc.urls")),
    path("api/v1/proposals/",    include("proposals.urls")),
    path("api/v1/projects/",     include("projects.urls")),
    path("api/v1/contracts/",    include("contracts.urls")),
    path("api/v1/wallet/",       include("wallet.urls")),
    path("api/v1/transactions/", include("transactions.urls")),
    path("api/v1/milestones/",   include("milestones.urls")),
    path("api/v1/proofs/",       include("proofs.urls")),
    path("api/v1/certificates/", include("certificates.urls")),
    path("api/v1/gamification/", include("gamification.urls")),
    path("api/v1/notifications/",include("notifications.urls")),
    path("api/v1/geo/",          include("geo.urls")),
    path("api/v1/weather/",      include("weather.urls")),
    path("api/v1/admin-panel/",  include("adminpanel.urls")),
]
