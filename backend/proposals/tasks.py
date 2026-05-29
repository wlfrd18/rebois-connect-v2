"""
Tâches Celery asynchrones pour le module proposals.

Celery = file d'attente de tâches en arrière-plan.
Quand un Volontaire soumet un terrain, on ne bloque pas
sa réponse HTTP pour appeler Nominatim — on délègue ça à Celery.
"""
from celery import shared_task
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import piexif
import logging
from math import radians, sin, cos, sqrt, atan2

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def geocode_proposal(self, proposal_id):
    """
    Appelle Nominatim (OpenStreetMap) pour obtenir l'adresse
    à partir des coordonnées GPS du terrain.
    Relance automatiquement jusqu'à 3 fois en cas d'échec.
    """
    from .models import Proposal

    try:
        proposal = Proposal.objects.get(id=proposal_id)
    except Proposal.DoesNotExist:
        logger.error(f"Proposal {proposal_id} introuvable")
        return

    try:
        geolocator = Nominatim(user_agent="rebois-connect/1.0")
        location   = geolocator.reverse(
            f"{proposal.latitude}, {proposal.longitude}",
            language="fr",
            timeout=10
        )

        if location:
            addr = location.raw.get("address", {})
            proposal.address_full    = location.address
            proposal.address_country = addr.get("country", "")
            proposal.address_region  = addr.get("state", addr.get("region", ""))
            proposal.address_city    = addr.get("city", addr.get("town", addr.get("village", "")))
            proposal.nominatim_raw   = location.raw
            proposal.save(update_fields=[
                "address_full", "address_country", "address_region",
                "address_city", "nominatim_raw"
            ])
            logger.info(f"Geocoding OK pour proposal {proposal_id}: {location.address}")
        else:
            logger.warning(f"Nominatim n'a pas trouvé d'adresse pour {proposal_id}")

    except (GeocoderTimedOut, GeocoderServiceError) as exc:
        logger.warning(f"Nominatim timeout pour {proposal_id}, retry...")
        raise self.retry(exc=exc)
    except Exception as exc:
        logger.error(f"Erreur geocoding {proposal_id}: {exc}")


@shared_task
def verify_photo_exif(photo_id):
    """
    Vérifie les métadonnées EXIF d'une photo uploadée par le Volontaire.

    Stratégie :
    1. Extraire les coordonnées GPS des métadonnées EXIF
    2. Calculer la distance entre les coords EXIF et les coords déclarées du terrain
    3. Si distance < 500m → gps_match = True (photo prise sur le terrain)
    4. Supprimer les données EXIF sensibles après extraction (vie privée)
    """
    from .models import ProposalPhoto

    try:
        photo = ProposalPhoto.objects.select_related("proposal").get(id=photo_id)
    except ProposalPhoto.DoesNotExist:
        return

    try:
        # Lire le fichier depuis MinIO
        photo.file.open("rb")
        raw = photo.file.read()
        photo.file.close()

        exif_data = piexif.load(raw)
        gps_info  = exif_data.get("GPS", {})

        if gps_info:
            lat = _convert_gps(gps_info.get(piexif.GPSIFD.GPSLatitude),
                               gps_info.get(piexif.GPSIFD.GPSLatitudeRef))
            lon = _convert_gps(gps_info.get(piexif.GPSIFD.GPSLongitude),
                               gps_info.get(piexif.GPSIFD.GPSLongitudeRef))

            if lat and lon:
                distance = _haversine_distance(
                    float(photo.proposal.latitude),
                    float(photo.proposal.longitude),
                    lat, lon
                )
                photo.exif_latitude         = lat
                photo.exif_longitude        = lon
                photo.gps_distance_meters   = int(distance)
                photo.gps_match             = distance <= 500  # tolérance 500 mètres
                photo.exif_verified         = True

        photo.save(update_fields=[
            "exif_latitude", "exif_longitude",
            "gps_distance_meters", "gps_match", "exif_verified"
        ])

    except Exception as e:
        logger.error(f"Erreur EXIF pour photo {photo_id}: {e}")


def _convert_gps(coord, ref):
    """Convertit les coordonnées EXIF (degrés/minutes/secondes) en décimal"""
    if not coord or not ref:
        return None
    try:
        d = coord[0][0] / coord[0][1]
        m = coord[1][0] / coord[1][1]
        s = coord[2][0] / coord[2][1]
        decimal = d + m / 60 + s / 3600
        if ref in [b"S", b"W"]:
            decimal = -decimal
        return round(decimal, 6)
    except (ZeroDivisionError, IndexError, TypeError):
        return None


def _haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calcule la distance en mètres entre deux points GPS.
    Formule de Haversine — précise pour les courtes distances.
    """
    R = 6371000  # rayon de la Terre en mètres
    φ1, φ2 = radians(lat1), radians(lat2)
    Δφ = radians(lat2 - lat1)
    Δλ = radians(lon2 - lon1)
    a = sin(Δφ/2)**2 + cos(φ1) * cos(φ2) * sin(Δλ/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))
