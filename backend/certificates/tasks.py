from celery import shared_task
import hashlib
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def generate_certificate_pdf(certificate_id):
    from .models import CO2Certificate
    try:
        cert = CO2Certificate.objects.select_related("mecene", "contract").get(id=certificate_id)
        _generate_pdf(cert)
        cert.status    = CO2Certificate.Status.ISSUED
        cert.issued_at = timezone.now()
        cert.save(update_fields=["status", "issued_at"])
        logger.info(f"Certificat {cert.serial_number} émis")
    except Exception as e:
        logger.error(f"Erreur génération certificat {certificate_id}: {e}")


def _generate_pdf(cert):
    from django.template.loader import render_to_string
    from weasyprint import HTML
    from django.core.files.base import ContentFile

    context = {"cert": cert, "mecene": cert.mecene}
    html    = render_to_string("certificates/certificate.html", context)
    pdf     = HTML(string=html).write_pdf()
    sha256  = hashlib.sha256(pdf).hexdigest()
    fname   = f"certificate_{cert.serial_number}_{sha256[:8]}.pdf"
    cert.pdf_file          = ContentFile(pdf, name=fname)
    cert.certificate_hash  = sha256
    cert.save(update_fields=["pdf_file", "certificate_hash"])


@shared_task
def issue_certificates_for_project(project_id):
    """
    Lance l'émission des certificats pour tous les Mécènes d'un projet
    une fois le projet terminé.
    """
    from wallet.models import MeceneCommitment, EscrowAccount
    from .models import CO2Certificate
    from proposals.models import Proposal
    import uuid as uuid_module

    try:
        escrow = EscrowAccount.objects.get(project_id=project_id)
        commitments = MeceneCommitment.objects.filter(
            escrow=escrow, status=MeceneCommitment.Status.CONFIRMED
        ).select_related("mecene")

        proposal = Proposal.objects.filter(
            status=Proposal.Status.APPROVED
        ).first()

        for i, commitment in enumerate(commitments, 1):
            serial = f"RC-{timezone.now().year}-{str(i).zfill(5)}-{str(uuid_module.uuid4())[:4].upper()}"
            cert = CO2Certificate.objects.create(
                serial_number      = serial,
                mecene             = commitment.mecene,
                project_id         = project_id,
                project_title      = escrow.project_title,
                co2_tons_certified = commitment.co2_tons_allocated,
                co2_share_percent  = commitment.co2_share_percent,
                investment_amount  = commitment.amount,
                currency           = commitment.currency,
                project_country    = proposal.address_country if proposal else "",
                surface_hectares   = proposal.surface_final if proposal else 0,
                start_date         = timezone.now().date(),
                end_date           = timezone.now().date().replace(
                    year=timezone.now().year + 30
                ),
            )
            generate_certificate_pdf.delay(str(cert.id))

    except Exception as e:
        logger.error(f"Erreur émission certificats projet {project_id}: {e}")
