from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from .models import Proposal


def create_user(email, username, role, kyc=True):
    user = User.objects.create_user(
        email=email, username=username,
        role=role, password="SecurePass2024!"
    )
    if kyc:
        user.kyc_status = User.KYCStatus.APPROVED
        user.save()
    return user


class ProposalPermissionsTest(TestCase):

    def setUp(self):
        self.client        = APIClient()
        self.login_url     = "/api/v1/auth/login/"
        self.proposals_url = "/api/v1/proposals/"

        self.volontaire = create_user("vol@test.com",  "volontaire1", "volontaire")
        self.mecene     = create_user("mec@test.com",  "mecene1",     "mecene")
        self.structure  = create_user("str@test.com",  "structure1",  "structure")
        self.admin      = User.objects.create_superuser(
            email="admin@test.com", username="admin1", password="SecurePass2024!"
        )

    def _login(self, user_email):
        response = self.client.post(self.login_url, {
            "email": user_email, "password": "SecurePass2024!"
        })
        # Si le login échoue, on ne plante pas — on nettoie juste les credentials
        if "access" not in response.data:
            self.client.credentials()
            return False
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return True

    def test_volontaire_can_create_proposal(self):
        """Un Volontaire avec KYC approuvé peut soumettre un terrain."""
        self._login("vol@test.com")
        data = {
            "title":            "Terrain Yaoundé",
            "description":      "Terrain dégradé au nord de Yaoundé",
            "land_type":        "degraded_forest",
            "surface_hectares": "5.5",
            "latitude":         "3.8480",
            "longitude":        "11.5021",
        }
        response = self.client.post(self.proposals_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")

    def test_mecene_cannot_create_proposal(self):
        """SÉCURITÉ : Un Mécène ne peut pas soumettre un terrain."""
        self._login("mec@test.com")
        data = {
            "title": "Terrain Dakar", "description": "Test",
            "land_type": "savanna", "surface_hectares": "3.0",
            "latitude": "14.7167", "longitude": "-17.4677",
        }
        response = self.client.post(self.proposals_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_structure_cannot_create_proposal(self):
        """SÉCURITÉ : Une Structure ne peut pas soumettre un terrain."""
        self._login("str@test.com")
        data = {
            "title": "Terrain Test", "description": "Test",
            "land_type": "bare_land", "surface_hectares": "2.0",
            "latitude": "5.3599", "longitude": "-4.0082",
        }
        response = self.client.post(self.proposals_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_volontaire_sees_only_own_proposals(self):
        """Un Volontaire ne voit que ses propres terrains."""
        vol2 = create_user("vol2@test.com", "volontaire2", "volontaire")
        Proposal.objects.create(
            volontaire=vol2, title="Terrain Vol2",
            description="Test", land_type="savanna",
            surface_hectares=3, latitude=4.05, longitude=9.77,
            status=Proposal.Status.PENDING
        )
        Proposal.objects.create(
            volontaire=self.volontaire, title="Mon terrain",
            description="Test", land_type="bare_land",
            surface_hectares=2, latitude=3.85, longitude=11.50,
            status=Proposal.Status.PENDING
        )
        self._login("vol@test.com")
        response = self.client.get(self.proposals_url)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Mon terrain")

    def test_mecene_sees_only_approved_proposals(self):
        """SÉCURITÉ : Un Mécène ne voit que les terrains approuvés."""
        Proposal.objects.create(
            volontaire=self.volontaire, title="Terrain pending",
            description="Test", land_type="savanna",
            surface_hectares=3, latitude=4.05, longitude=9.77,
            status=Proposal.Status.PENDING
        )
        Proposal.objects.create(
            volontaire=self.volontaire, title="Terrain approuvé",
            description="Test", land_type="bare_land",
            surface_hectares=5, latitude=3.85, longitude=11.50,
            status=Proposal.Status.APPROVED
        )
        self._login("mec@test.com")
        response = self.client.get(self.proposals_url)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Terrain approuvé")

    def test_admin_sees_all_proposals(self):
        """L'Admin voit tous les terrains quel que soit leur statut."""
        Proposal.objects.create(
            volontaire=self.volontaire, title="Terrain 1",
            description="Test", land_type="savanna",
            surface_hectares=3, latitude=4.05, longitude=9.77,
            status=Proposal.Status.PENDING
        )
        Proposal.objects.create(
            volontaire=self.volontaire, title="Terrain 2",
            description="Test", land_type="bare_land",
            surface_hectares=5, latitude=3.85, longitude=11.50,
            status=Proposal.Status.APPROVED
        )
        self._login("admin@test.com")
        response = self.client.get(self.proposals_url)
        self.assertEqual(response.data["count"], 2)

    def test_volontaire_without_kyc_cannot_create(self):
        """
        SÉCURITÉ : Un Volontaire sans KYC approuvé ne peut pas
        soumettre de terrain.

        Correction : on teste directement la permission avec
        un token valide, sans passer par le login qui lui réussit.
        Le KYC est vérifié au niveau du endpoint, pas du login.
        """
        vol_no_kyc = create_user("nokyc@test.com", "nokyc", "volontaire", kyc=False)

        # On force le token directement sans passer par _login
        login = self.client.post(self.login_url, {
            "email": "nokyc@test.com", "password": "SecurePass2024!"
        })
        # Le login réussit — c'est normal, KYC n'est pas un blocage au login
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        # Mais la création de terrain est bloquée par la permission IsVolontaireKYC
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        data = {
            "title": "Terrain sans KYC", "description": "Test",
            "land_type": "savanna", "surface_hectares": "3.0",
            "latitude": "4.05", "longitude": "9.77",
        }
        response = self.client.post(self.proposals_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_pre_validate(self):
        """L'Admin peut pré-valider un terrain en attente."""
        proposal = Proposal.objects.create(
            volontaire=self.volontaire, title="Terrain à valider",
            description="Test", land_type="savanna",
            surface_hectares=3, latitude=4.05, longitude=9.77,
            status=Proposal.Status.PENDING
        )
        self._login("admin@test.com")
        response = self.client.post(
            f"/api/v1/proposals/{proposal.id}/pre_validate/",
            {"note": "Documents vérifiés."}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        proposal.refresh_from_db()
        self.assertEqual(proposal.status, Proposal.Status.PRE_VALIDATED)

    def test_volontaire_cannot_pre_validate(self):
        """SÉCURITÉ : Un Volontaire ne peut pas valider son propre terrain."""
        proposal = Proposal.objects.create(
            volontaire=self.volontaire, title="Mon terrain",
            description="Test", land_type="savanna",
            surface_hectares=3, latitude=4.05, longitude=9.77,
            status=Proposal.Status.PENDING
        )
        self._login("vol@test.com")
        response = self.client.post(f"/api/v1/proposals/{proposal.id}/pre_validate/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_surface_validation(self):
        """La surface minimale est de 0.5 hectare."""
        self._login("vol@test.com")
        data = {
            "title": "Trop petit", "description": "Test",
            "land_type": "savanna", "surface_hectares": "0.1",
            "latitude": "4.05", "longitude": "9.77",
        }
        response = self.client.post(self.proposals_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
