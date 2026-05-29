from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import sentry_sdk
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Sécurité core ─────────────────────────────────────────────
SECRET_KEY  = os.getenv("SECRET_KEY")
DEBUG       = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost").split(",")

# ── Applications ─────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "channels",
    "django_celery_beat",
    "django_celery_results",
    # Modules métier
    "users",
    "kyc",
    "proposals",
    "projects",
    "contracts",
    "wallet",
    "transactions",
    "milestones",
    "proofs",
    "certificates",
    "gamification",
    "notifications",
    "geo",
    "weather",
    "adminpanel",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF    = "config.urls"
AUTH_USER_MODEL = "users.User"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"  # Daphne / Channels

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "templates"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

# ── Base de données ───────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME":     os.getenv("DB_NAME"),
        "USER":     os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST":     os.getenv("DB_HOST", "localhost"),
        "PORT":     os.getenv("DB_PORT", "5432"),
    }
}

# ── Redis + Channels ──────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [REDIS_URL]},
    }
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# ── Celery ────────────────────────────────────────────────────
CELERY_BROKER_URL          = REDIS_URL
CELERY_RESULT_BACKEND      = "django-db"
CELERY_CACHE_BACKEND       = "django-cache"
CELERY_ACCEPT_CONTENT      = ["json"]
CELERY_TASK_SERIALIZER     = "json"
CELERY_RESULT_SERIALIZER   = "json"
CELERY_TIMEZONE            = "Europe/Paris"
CELERY_BEAT_SCHEDULER      = "django_celery_beat.schedulers:DatabaseScheduler"

# ── Stockage MinIO ────────────────────────────────────────────
DEFAULT_FILE_STORAGE    = "storages.backends.s3boto3.S3Boto3Storage"
AWS_S3_ENDPOINT_URL     = f"http://{os.getenv('MINIO_ENDPOINT', 'localhost:9000')}"
AWS_ACCESS_KEY_ID       = os.getenv("MINIO_ACCESS_KEY")
AWS_SECRET_ACCESS_KEY   = os.getenv("MINIO_SECRET_KEY")
AWS_STORAGE_BUCKET_NAME = "rebois-media"
AWS_S3_FILE_OVERWRITE   = False
AWS_DEFAULT_ACL         = "private"   # aucun fichier public par défaut

# ── DRF ───────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 12,
    # Throttling : anti brute-force
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "20/minute",
        "user": "100/minute",
        "login": "5/minute",     # throttle spécial pour /auth/login
    },
}

# ── JWT ───────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":  timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS":  True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "UPDATE_LAST_LOGIN": True,
}

# ── Password hashing (Argon2 en premier) ──────────────────────
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── CORS ──────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True

# ── Sécurité HTTP headers ─────────────────────────────────────
SECURE_BROWSER_XSS_FILTER    = True
SECURE_CONTENT_TYPE_NOSNIFF  = True
X_FRAME_OPTIONS              = "DENY"
SECURE_REFERRER_POLICY       = "strict-origin-when-cross-origin"
# En production passer à True :
SECURE_SSL_REDIRECT          = False
SESSION_COOKIE_SECURE        = False
CSRF_COOKIE_SECURE           = False

# ── Admin sécurisé ────────────────────────────────────────────
ADMIN_URL = os.getenv("ADMIN_URL", "admin-secure-rebois")

# ── Email ─────────────────────────────────────────────────────
EMAIL_BACKEND   = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST      = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT      = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS   = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL  = "Rebois Connect <noreply@reboisconnect.com>"

# ── Sentry ────────────────────────────────────────────────────
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.2,
        profiles_sample_rate=0.1,
    )

# ── Internationalisation ──────────────────────────────────────
LANGUAGE_CODE = "fr-fr"
TIME_ZONE     = "Europe/Paris"
USE_I18N      = True
USE_TZ        = True

STATIC_URL  = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL   = "/media/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
