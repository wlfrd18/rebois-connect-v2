from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User
from .serializers import RegisterSerializer, UserSerializer
from .tasks import send_activation_email, send_password_reset_email
from users.permissions import IsAdmin

class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        ip = self.request.META.get("REMOTE_ADDR")
        # Compte inactif jusqu'à activation email
        user = serializer.save(last_login_ip=ip, is_active=False)

        # Générer le token d'activation
        token = default_token_generator.make_token(user)
        uid   = urlsafe_base64_encode(force_bytes(user.pk))

        # Envoyer l'email d'activation via Celery
	send_activation_email(str(user.id), token, uid)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return Response({
            "detail": "Compte créé. Vérifiez votre email pour activer votre compte.",
        }, status=status.HTTP_201_CREATED)


class ActivateAccountView(APIView):
    """Activation du compte via le lien email."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, uid, token):
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user    = User.objects.get(pk=user_id)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({"detail": "Lien invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Lien expiré ou invalide."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.save()
        return Response({"detail": "Compte activé ! Vous pouvez maintenant vous connecter."})


class PasswordResetRequestView(APIView):
    """Demande de réinitialisation de mot de passe."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        if not email:
            return Response({"detail": "Email requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user  = User.objects.get(email=email, is_active=True)
            token = default_token_generator.make_token(user)
            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            send_password_reset_email.delay(email, token, uid)
        except User.DoesNotExist:
            pass  # Ne pas révéler si l'email existe ou non

        # Toujours retourner le même message (sécurité)
        return Response({
            "detail": "Si cet email existe, vous recevrez un lien de réinitialisation."
        })


class PasswordResetConfirmView(APIView):
    """Confirmation du nouveau mot de passe."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, uid, token):
        password  = request.data.get("password", "")
        password2 = request.data.get("password2", "")

        if password != password2:
            return Response({"detail": "Les mots de passe ne correspondent pas."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user    = User.objects.get(pk=user_id)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({"detail": "Lien invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Lien expiré ou invalide."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(password, user)
        except ValidationError as e:
            return Response({"detail": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()
        return Response({"detail": "Mot de passe réinitialisé. Vous pouvez vous connecter."})


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data["refresh"])
            token.blacklist()
            return Response({"detail": "Déconnexion réussie."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"detail": "Token invalide."}, status=status.HTTP_400_BAD_REQUEST)

class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class   = UserSerializer

    def get_queryset(self):
        return User.objects.all().order_by("-created_at")


class AdminUserDetailView(generics.UpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class   = UserSerializer
    queryset           = User.objects.all()
