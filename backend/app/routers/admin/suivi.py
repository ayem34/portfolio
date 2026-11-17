"""Messages, demandes d'accès, statistiques et publication."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.enums import StatutDemande
from app.models import Consultation, DemandeAcces, Message, Projet
from app.routers.deps import get_or_404
from app.schemas.content import (
    ConsultationOut,
    DemandeAccepteeOut,
    DemandeAccesOut,
    MessageOut,
    MessageUpdate,
    PublicationOut,
    PublicationResult,
    StatCompteur,
    StatistiquesOut,
    StatProjet,
)
from app.services import access_codes, emails
from app.services.deploy import trigger_deploy
from app.services.mailer import Mailer, get_mailer, send_safely

router = APIRouter(tags=["admin : messages, demandes d'accès, statistiques, publication"])


# --- Messages ---


def _latest_messages(db: Session, limit: int | None = None) -> list[Message]:
    return list(db.scalars(select(Message).order_by(Message.id.desc()).limit(limit)))


@router.get("/messages", response_model=list[MessageOut])
def list_messages(db: Session = Depends(get_db)) -> list[Message]:
    return _latest_messages(db)


@router.put("/messages/{message_id}", response_model=MessageOut)
def update_message(message_id: int, data: MessageUpdate, db: Session = Depends(get_db)) -> Message:
    message = get_or_404(db, Message, message_id)
    message.traite = data.traite
    db.commit()
    return message


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(message_id: int, db: Session = Depends(get_db)) -> None:
    db.delete(get_or_404(db, Message, message_id))
    db.commit()


# --- Demandes d'accès ---


def _request_fields(db: Session, demande: DemandeAcces) -> dict:
    return {
        **{column.name: getattr(demande, column.name) for column in DemandeAcces.__table__.columns},
        "projet_slug": demande.projet.slug,
        "projet_titre": demande.projet.titre,
        "nb_consultations": db.scalar(
            select(func.count(Consultation.id)).where(Consultation.demande_id == demande.id)
        ),
    }


def _latest_requests(db: Session, limit: int | None = None) -> list[DemandeAccesOut]:
    demandes = db.scalars(select(DemandeAcces).order_by(DemandeAcces.id.desc()).limit(limit))
    return [DemandeAccesOut(**_request_fields(db, demande)) for demande in demandes]


def _pending_request(db: Session, demande_id: int) -> DemandeAcces:
    demande = get_or_404(db, DemandeAcces, demande_id)
    if demande.statut != StatutDemande.EN_ATTENTE:
        raise HTTPException(status.HTTP_409_CONFLICT, "demande_deja_traitee")
    return demande


@router.get("/demandes-acces", response_model=list[DemandeAccesOut])
def list_requests(db: Session = Depends(get_db)) -> list[DemandeAccesOut]:
    return _latest_requests(db)


@router.post("/demandes-acces/{demande_id}/accepter", response_model=DemandeAccepteeOut)
def accept_request(
    demande_id: int,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    mailer: Mailer = Depends(get_mailer),
) -> DemandeAccepteeOut:
    demande = _pending_request(db, demande_id)
    code = access_codes.grant(demande)
    db.commit()
    project_url = f"{get_settings().site_url}/projets/{demande.projet.slug}"
    background.add_task(
        send_safely, mailer, demande.email, emails.access_granted(demande, code, project_url)
    )
    return DemandeAccepteeOut(**_request_fields(db, demande), code=code)


@router.post("/demandes-acces/{demande_id}/refuser", response_model=DemandeAccesOut)
def refuse_request(
    demande_id: int,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    mailer: Mailer = Depends(get_mailer),
) -> DemandeAccesOut:
    demande = _pending_request(db, demande_id)
    demande.statut = StatutDemande.REFUSEE
    demande.date_decision = datetime.now(UTC)
    db.commit()
    background.add_task(send_safely, mailer, demande.email, emails.access_refused(demande))
    return DemandeAccesOut(**_request_fields(db, demande))


@router.post("/demandes-acces/{demande_id}/revoquer", response_model=DemandeAccesOut)
def revoke_request(demande_id: int, db: Session = Depends(get_db)) -> DemandeAccesOut:
    demande = get_or_404(db, DemandeAcces, demande_id)
    if demande.statut != StatutDemande.ACCEPTEE:
        raise HTTPException(status.HTTP_409_CONFLICT, "demande_non_acceptee")
    demande.statut = StatutDemande.REVOQUEE
    demande.code_hash = None
    demande.date_decision = datetime.now(UTC)
    db.commit()
    return DemandeAccesOut(**_request_fields(db, demande))


@router.get("/demandes-acces/{demande_id}/consultations", response_model=list[ConsultationOut])
def list_request_consultations(
    demande_id: int, db: Session = Depends(get_db)
) -> list[Consultation]:
    get_or_404(db, DemandeAcces, demande_id)
    return list(
        db.scalars(
            select(Consultation)
            .where(Consultation.demande_id == demande_id)
            .order_by(Consultation.id.desc())
        )
    )


# --- Statistiques ---


def _counts(db: Session, column, since: datetime) -> list[StatCompteur]:
    rows = db.execute(
        select(column, func.count(Consultation.id))
        .where(Consultation.date >= since, column.is_not(None))
        .group_by(column)
        .order_by(func.count(Consultation.id).desc())
    )
    return [StatCompteur(cle=key, total=total) for key, total in rows]


@router.get("/statistiques", response_model=StatistiquesOut)
def get_statistics(
    jours: int = Query(default=30, ge=1, le=365), db: Session = Depends(get_db)
) -> StatistiquesOut:
    since = datetime.now(UTC) - timedelta(days=jours)
    views = func.count(Consultation.id).filter(Consultation.type_demo.is_(None))
    launches = func.count(Consultation.id).filter(Consultation.type_demo.is_not(None))
    rows = db.execute(
        select(Projet, views, launches)
        .join(Consultation, Consultation.projet_id == Projet.id)
        .where(Consultation.date >= since)
        .group_by(Projet.id)
        .order_by(views.desc(), Projet.id)
    ).all()
    per_project = [
        StatProjet(
            projet_id=projet.id,
            slug=projet.slug,
            titre=projet.titre,
            vues=view_count,
            demos_lancees=launch_count,
        )
        for projet, view_count, launch_count in rows
    ]
    return StatistiquesOut(
        jours=jours,
        total_vues=sum(item.vues for item in per_project),
        total_demos_lancees=sum(item.demos_lancees for item in per_project),
        vues_par_projet=per_project,
        demos_lancees=_counts(db, Consultation.type_demo, since),
        metiers_choisis=_counts(db, Consultation.metier_choisi, since),
        messages_non_traites=db.scalar(
            select(func.count(Message.id)).where(Message.traite.is_(False))
        ),
        demandes_en_attente=db.scalar(
            select(func.count(DemandeAcces.id)).where(
                DemandeAcces.statut == StatutDemande.EN_ATTENTE
            )
        ),
        derniers_messages=_latest_messages(db, 5),
        dernieres_demandes=_latest_requests(db, 5),
    )


# --- Publication ---


@router.get("/publication", response_model=PublicationOut)
def get_publication() -> PublicationOut:
    settings = get_settings()
    return PublicationOut(configuree=bool(settings.deploy_hook_url), site_url=settings.site_url)


@router.post("/publication", response_model=PublicationResult)
def publish_site() -> PublicationResult:
    """« Mettre le site à jour » : déclenche la régénération des pages publiques."""
    trigger_deploy()
    return PublicationResult(declenchee=True)
