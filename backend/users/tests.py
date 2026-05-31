from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User


class UserRegistrationTest(TestCase):
    """Tests d'inscription — fonctionnel + sécurité"""

    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/v1/auth/register/"

    def test_register_volontaire_success(self):
        """Un Volontaire peut s'inscrire avec les bons champs."""
        data = {
            "email":     "volontaire@test.com",
            "username":  "volontaire1",
            "role":      "volontaire",
            "password":  "SecurePass2024!",
            "password2": "SecurePass2024!",
            "country":   "CM",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="volontaire@test.com").exists())

    def test_register_mecene_success(self):
        """Un Mécène peut s'inscrire."""
        data = {
            "email":     "mecene@test.com",
            "username":  "mecene1",
            "role":      "mecene",
            "password":  "SecurePass2024!",
            "password2": "SecurePass2024!",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_admin_blocked(self):
        """
        SÉCURITÉ : Personne ne peut s'auto-créer un compte Admin.
        C'est une vérification critique — une faille ici donnerait
        un accès total à la plateforme.
        """
        data = {
            "email":     "hacker@test.com",
            "username":  "hacker",
            "role":      "admin",
            "password":  "SecurePass2024!",
            "password2": "SecurePass2024!",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="hacker@test.com").exists())

    def test_register_password_mismatch(self):
        """Les mots de passe doivent correspondre."""
        data = {
            "email":     "test@test.com",
            "username":  "test1",
            "role":      "volontaire",
            "password":  "SecurePass2024!",
            "password2": "DifferentPass2024!",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password_blocked(self):
        """Un mot de passe trop simple est refusé."""
        data = {
            "email":     "test@test.com",
            "username":  "test1",
            "role":      "volontaire",
            "password":  "123",
            "password2": "123",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_structure_without_registration_number(self):
        """Une Structure sans numéro d'enregistrement est refusée."""
        data = {
            "email":             "structure@test.com",
            "username":          "structure1",
            "role":              "structure",
            "password":          "SecurePass2024!",
            "password2":         "SecurePass2024!",
            "organization_name": "Green Corp",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_email_blocked(self):
        """Deux comptes avec le même email sont interdits."""
        User.objects.create_user(
            email="existing@test.com", username="existing",
            role="volontaire", password="SecurePass2024!"
        )
        data = {
            "email":     "existing@test.com",
            "username":  "newuser",
            "role":      "volontaire",
            "password":  "SecurePass2024!",
            "password2": "SecurePass2024!",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AuthenticationTest(TestCase):
    """Tests d'authentification JWT"""

    def setUp(self):
        self.client   = APIClient()
        self.login_url = "/api/v1/auth/login/"
        self.user = User.objects.create_user(
            email="user@test.com", username="testuser",
            role="volontaire", password="SecurePass2024!"
        )

    def test_login_success(self):
        """Un utilisateur peut se connecter avec les bons identifiants."""
        response = self.client.post(self.login_url, {
            "email":    "user@test.com",
            "password": "SecurePass2024!"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access",  response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):
        """Un mauvais mot de passe est refusé."""
        response = self.client.post(self.login_url, {
            "email":    "user@test.com",
            "password": "wrongpassword"
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_without_token(self):
        """
        SÉCURITÉ : Un endpoint protégé refuse les requêtes sans token.
        """
        response = self.client.get("/api/v1/proposals/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_with_token(self):
        """Avec un token valide, l'endpoint répond."""
        login = self.client.post(self.login_url, {
            "email": "user@test.com", "password": "SecurePass2024!"
        })
        token = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/proposals/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_me_endpoint(self):
        """L'endpoint /me/ retourne le profil de l'utilisateur connecté."""
        login = self.client.post(self.login_url, {
            "email": "user@test.com", "password": "SecurePass2024!"
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "user@test.com")
        self.assertEqual(response.data["role"],  "volontaire")
