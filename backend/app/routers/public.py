"""Routes publiques : contenu publié, contact, accès sur demande, consultations."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.enums import AccesCode
from app.models import Consultation, DemandeAcces, Message, Metier, Projet
from app.rate_limit import (
    ACCESS_CODE_LIMIT,
    ACCESS_REQUEST_LIMIT,
    CONSULTATION_LIMIT,
    CONTACT_LIMIT,
    limiter,
)
from app.schemas.content import AccesIn, ConsultationIn, ContactIn, DemandeAccesIn
from app.schemas.public import PublicProjetDetail, PublicSite
from app.services import access_codes, emails, public_content
from app.services.mailer import Mailer, get_mailer, send_safely

router = APIRouter(prefix="/api/public", tags=["public"])


def get_published_project(slug: str, db: Session = Depends(get_db)) -> Projet:
    projet = db.scalar(select(Projet).where(Projet.slug == slug))
    if projet is None or not public_content.is_published(projet):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "introuvable")
    return projet


def _known_metier(db: Session, slug: str | None) -> str | None:
    if slug and db.scalar(select(Metier.id).where(Metier.slug == slug)) is not None:
        return slug
    return None


@router.get("/site", response_model=PublicSite)
def get_site(db: Session = Depends(get_db)) -> PublicSite:
    return public_content.site(db)


@router.get("/projets/{slug}", response_model=PublicProjetDetail)
def get_project(projet: Projet = Depends(get_published_project)) -> PublicProjetDetail:
    return public_content.project_detail(projet)


@router.post("/projets/{slug}/acces", response_model=PublicProjetDetail)
@limiter.limit(ACCESS_CODE_LIMIT)
def unlock_project(
    request: Request,
    data: AccesIn,
    projet: Projet = Depends(get_published_project),
    db: Session = Depends(get_db),
) -> PublicProjetDetail:
    demande = access_codes.find_valid_request(db, projet.id, data.code)
    if demande is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "code_invalide")
    db.add(Consultation(projet_id=projet.id, demande_id=demande.id))
    db.commit()
    return public_content.project_detail(projet, unlocked=True)


@router.post("/projets/{slug}/demandes-acces", status_code=status.HTTP_201_CREATED)
@limiter.limit(ACCESS_REQUEST_LIMIT)
def request_access(
    request: Request,
    data: DemandeAccesIn,
    background: BackgroundTasks,
    projet: Projet = Depends(get_published_project),
    db: Session = Depends(get_db),
    mailer: Mailer = Depends(get_mailer),
) -> dict[str, bool]:
    if projet.acces_code != AccesCode.CONFIDENTIEL:
        raise HTTPException(status.HTTP_409_CONFLICT, "projet_non_confidentiel")
    if not data.site_web:
        demande = DemandeAcces(
            projet_id=projet.id,
            nom=data.nom,
            entreprise=data.entreprise,
            email=data.email,
            motif=data.motif,
        )
        db.add(demande)
        db.commit()
        db.refresh(demande)
        settings = get_settings()
        background.add_task(
            send_safely,
            mailer,
            settings.notification_recipient,
            emails.new_access_request(demande, f"{settings.site_url}/admin/demandes-acces"),
        )
    # Un robot pris au piège reçoit la même réponse qu'un visiteur.
    return {"recu": True}


@router.post("/messages", status_code=status.HTTP_201_CREATED)
@limiter.limit(CONTACT_LIMIT)
def send_message(
    request: Request,
    data: ContactIn,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    mailer: Mailer = Depends(get_mailer),
) -> dict[str, bool]:
    if not data.site_web:
        message = Message(
            objet=data.objet,
            nom=data.nom,
            entreprise=data.entreprise,
            email=data.email,
            contenu=data.contenu,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        background.add_task(
            send_safely,
            mailer,
            get_settings().notification_recipient,
            emails.new_message(message),
        )
    return {"recu": True}


@router.post("/consultations", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(CONSULTATION_LIMIT)
def record_consultation(
    request: Request, data: ConsultationIn, db: Session = Depends(get_db)
) -> None:
    projet = get_published_project(data.slug, db)
    db.add(
        Consultation(
            projet_id=projet.id,
            type_demo=data.type_demo,
            metier_choisi=_known_metier(db, data.metier_choisi),
        )
    )
    db.commit()
