"""
Génération PDF du contrat tripartite avec WeasyPrint.

DevSecOps :
- Le PDF est hashé (SHA256) après génération
- Le hash est stocké en base — toute modification du PDF est détectable
- Les PDFs sont stockés dans MinIO avec accès privé uniquement
"""
from celery import shared_task
import hashlib
import logging

logger = logging.getLogger(__name__)


@shared_task
def generate_contract_pdf(contract_id):
    from .models import Contract
    try:
        contract = Contract.objects.get(id=contract_id)
        _generate_pdf(contract)
    except Contract.DoesNotExist:
        logger.error(f"Contract {contract_id} introuvable")
    except Exception as e:
        logger.error(f"Erreur génération PDF contrat {contract_id}: {e}")


def _generate_pdf(contract):
    from django.template.loader import render_to_string
    from weasyprint import HTML
    import io
    from django.core.files.base import ContentFile

    # Contexte pour le template HTML
    context = {
        "contract":   contract,
        "volontaire": contract.volontaire,
        "structure":  contract.structure,
        "admin":      contract.admin,
        "mecenes":    contract.mecenes.all(),
        "milestones": [],  # à connecter au module milestones
    }

    html_content = render_to_string("contracts/contract.html", context)
    pdf_bytes    = HTML(string=html_content).write_pdf()

    # Calcul du hash SHA256 pour l'intégrité
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()

    # Sauvegarde dans MinIO
    filename = f"contract_{contract.id}_{sha256[:8]}.pdf"
    contract.pdf_file      = ContentFile(pdf_bytes, name=filename)
    contract.document_hash = sha256
    contract.save(update_fields=["pdf_file", "document_hash"])

    logger.info(f"PDF généré pour contrat {contract.id} — hash: {sha256[:16]}...")
