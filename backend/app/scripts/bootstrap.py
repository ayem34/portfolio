"""Préparation de la base au démarrage : compte admin, métiers, profil, contenu d'exemple.

Peut être relancé sans risque : rien n'est créé en double.
Usage : python -m app.scripts.bootstrap
"""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import SessionLocal
from app.models import Admin, Metier, Profil
from app.scripts.example_content import seed_example_content
from app.security import hash_password
from app.services.storage import build_storage

logger = logging.getLogger("bootstrap")

METIERS = [
    ("data-analyst", {"fr": "Data Analyst", "en": "Data Analyst"}),
    ("data-engineer", {"fr": "Data Engineer", "en": "Data Engineer"}),
    ("full-stack", {"fr": "Développeuse Full Stack", "en": "Full Stack Developer"}),
]


def ensure_admin(db: Session, settings: Settings) -> bool:
    """Crée le compte admin s'il n'existe aucun compte. Renvoie True s'il a été créé."""
    if db.scalar(select(Admin.id).limit(1)) is not None:
        return False
    if not settings.admin_email or not settings.admin_password:
        logger.warning("ADMIN_EMAIL ou ADMIN_PASSWORD manquant : aucun compte admin créé.")
        return False
    db.add(
        Admin(
            email=settings.admin_email.strip().lower(),
            mot_de_passe_hash=hash_password(settings.admin_password),
        )
    )
    return True


def ensure_metiers(db: Session) -> None:
    existing = set(db.scalars(select(Metier.slug)))
    for ordre, (slug, nom) in enumerate(METIERS):
        if slug not in existing:
            db.add(Metier(slug=slug, nom=nom, ordre=ordre))


def ensure_profil(db: Session) -> None:
    if db.get(Profil, 1) is None:
        db.add(Profil(id=1))


def bootstrap(db: Session, settings: Settings) -> None:
    first_start = ensure_admin(db, settings)
    if first_start:
        logger.info("Compte admin créé pour %s", settings.admin_email)
    ensure_metiers(db)
    ensure_profil(db)
    db.flush()
    # Le contenu d'exemple n'est proposé qu'au tout premier démarrage : supprimé
    # ensuite par Ayem, il ne revient pas.
    if first_start and settings.seed_example_content:
        seed_example_content(db, build_storage(settings))
    db.commit()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(name)s: %(message)s")
    with SessionLocal() as db:
        bootstrap(db, get_settings())


if __name__ == "__main__":
    main()
