from django.contrib import admin
from django.urls import path, include
from django.conf import settings

# URL admin sécurisée — pas /admin/ classique
admin.site.site_header = "Rebois Connect — Administration"

urlpatterns = [
    # Admin sur URL secrète définie dans .env
    path(f"{settings.ADMIN_URL}/", admin.site.urls),

    # API versionnée
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
