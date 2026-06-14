"""
Tâches Celery pour les emails transactionnels.
- Activation de compte
- Réinitialisation de mot de passe
"""
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_activation_email(user_id: str, token: str, uid: str):
    from users.models import User
    try:
        user = User.objects.get(id=user_id)
        link = f"{settings.FRONTEND_URL}/activate/{uid}/{token}/"
        send_mail(
            subject="🌱 Rebois Connect — Activez votre compte",
            message=f"""
Bonjour {user.first_name or user.username},

Merci de vous être inscrit sur Rebois Connect !

Cliquez sur le lien ci-dessous pour activer votre compte :
{link}

Ce lien expire dans 24 heures.

Si vous n'avez pas créé de compte, ignorez cet email.

L'équipe Rebois Connect
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Email d'activation envoyé à {user.email}")
    except Exception as e:
        logger.error(f"Erreur envoi email activation {user_id}: {e}")


@shared_task
def send_password_reset_email(email: str, token: str, uid: str):
    try:
        link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
        send_mail(
            subject="🌱 Rebois Connect — Réinitialisation de mot de passe",
            message=f"""
Bonjour,

Vous avez demandé une réinitialisation de mot de passe.

Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :
{link}

Ce lien expire dans 1 heure.

Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe reste inchangé.

L'équipe Rebois Connect
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info(f"Email reset password envoyé à {email}")
    except Exception as e:
        logger.error(f"Erreur envoi email reset {email}: {e}")


@shared_task
def send_kyc_approved_email(user_id: str):
    from users.models import User
    try:
        user = User.objects.get(id=user_id)
        send_mail(
            subject="🌱 Rebois Connect — Votre compte est vérifié !",
            message=f"""
Bonjour {user.first_name or user.username},

Bonne nouvelle ! Votre vérification KYC a été approuvée.

Vous pouvez maintenant accéder à toutes les fonctionnalités de Rebois Connect.

Connectez-vous : {settings.FRONTEND_URL}/login

L'équipe Rebois Connect
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Erreur envoi email KYC approved {user_id}: {e}")
