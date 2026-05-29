import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("rebois_connect")
app.config_from_object("django.conf:settings", namespace="CELERY")

# Autodécouverte des tâches dans chaque module
app.autodiscover_tasks()
