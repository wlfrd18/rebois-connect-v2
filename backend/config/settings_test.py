"""
Settings pour l'environnement de test.
Hérite de settings.py et désactive uniquement ce qui gêne les tests.

DevSecOps : on ne désactive JAMAIS le throttling en production.
Ce fichier est utilisé UNIQUEMENT par le pipeline CI/CD et les tests locaux.
"""
from .settings import *

# Désactiver le throttling pendant les tests
# Le throttling est testé séparément dans des tests dédiés
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]   = {}

# Base de données de test en mémoire (plus rapide)
# On garde PostgreSQL pour que les tests reflètent la production
# mais on peut accélérer avec SQLite si besoin :
# DATABASES["default"]["ENGINE"] = "django.db.backends.sqlite3"

# Désactiver Sentry en test
SENTRY_DSN = ""

# Email en mode console (pas d'envoi réel)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
