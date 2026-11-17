"""Codes d'accès temporaires des projets confidentiels.

Le code n'est jamais stocké : seule son empreinte (HMAC-SHA256) l'est, avec une date d'expiration.
"""

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.enums import StatutDemande
from app.models import DemandeAcces

CODE_VALIDITY = timedelta(days=7)
# Sans 0/O ni 1/I/L : le code est recopié à la main depuis un e-mail.
_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
_GROUPS, _GROUP_LENGTH = 3, 4


def generate_code() -> str:
    groups = (
        "".join(secrets.choice(_ALPHABET) for _ in range(_GROUP_LENGTH)) for _ in range(_GROUPS)
    )
    return "-".join(groups)


def hash_code(code: str) -> str:
    key = get_settings().secret_key.encode()
    return hmac.new(key, code.strip().upper().encode(), hashlib.sha256).hexdigest()


def grant(demande: DemandeAcces) -> str:
    """Accepte la demande et renvoie le code en clair (à transmettre une seule fois)."""
    code = generate_code()
    now = datetime.now(UTC)
    demande.statut = StatutDemande.ACCEPTEE
    demande.code_hash = hash_code(code)
    demande.expire_le = now + CODE_VALIDITY
    demande.date_decision = now
    return code


def find_valid_request(db: Session, projet_id: int, code: str) -> DemandeAcces | None:
    return db.scalar(
        select(DemandeAcces).where(
            DemandeAcces.projet_id == projet_id,
            DemandeAcces.code_hash == hash_code(code),
            DemandeAcces.statut == StatutDemande.ACCEPTEE,
            DemandeAcces.expire_le > datetime.now(UTC),
        )
    )
