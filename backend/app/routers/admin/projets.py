from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.enums import StatutPublication
from app.models import Projet, Technologie, VersionProjet
from app.routers.deps import apply_order, get_or_404, next_position
from app.schemas.common import OrderIn
from app.schemas.projet import ProjetIn, ProjetOut, StatutIn, VersionOut
from app.schemas.public import PublicProjetDetail
from app.services import projects, public_content

router = APIRouter(prefix="/projets", tags=["admin : projets"])


def _all_projects(db: Session) -> list[Projet]:
    return list(db.scalars(select(Projet).order_by(Projet.ordre, Projet.id)))


def to_out(projet: Projet) -> ProjetOut:
    return ProjetOut(
        **projects.snapshot(projet),
        id=projet.id,
        ordre=projet.ordre,
        statut_publication=projet.statut_publication,
        date_creation=projet.date_creation,
        date_modification=projet.date_modification,
        date_publication=projet.date_publication,
    )


def _saved(db: Session, projet: Projet) -> ProjetOut:
    db.commit()
    db.refresh(projet)
    return to_out(projet)


@router.get("", response_model=list[ProjetOut])
def list_projects(db: Session = Depends(get_db)) -> list[ProjetOut]:
    return [to_out(projet) for projet in _all_projects(db)]


@router.post("", response_model=ProjetOut, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjetIn, db: Session = Depends(get_db)) -> ProjetOut:
    projet = Projet(ordre=next_position(_all_projects(db)))
    projects.apply(db, projet, data)
    db.add(projet)
    return _saved(db, projet)


@router.put("/ordre", status_code=status.HTTP_204_NO_CONTENT)
def reorder_projects(data: OrderIn, db: Session = Depends(get_db)) -> None:
    apply_order(_all_projects(db), data.ids)
    db.commit()


@router.get("/{projet_id}", response_model=ProjetOut)
def get_project(projet_id: int, db: Session = Depends(get_db)) -> ProjetOut:
    return to_out(get_or_404(db, Projet, projet_id))


@router.put("/{projet_id}", response_model=ProjetOut)
def update_project(projet_id: int, data: ProjetIn, db: Session = Depends(get_db)) -> ProjetOut:
    projet = get_or_404(db, Projet, projet_id)
    projects.save_version(db, projet)
    projects.apply(db, projet, data)
    return _saved(db, projet)


@router.delete("/{projet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(projet_id: int, db: Session = Depends(get_db)) -> None:
    db.delete(get_or_404(db, Projet, projet_id))
    db.commit()


@router.post("/{projet_id}/statut", response_model=ProjetOut)
def set_status(projet_id: int, data: StatutIn, db: Session = Depends(get_db)) -> ProjetOut:
    projet = get_or_404(db, Projet, projet_id)
    projet.statut_publication = data.statut
    if data.statut == StatutPublication.PUBLIE and projet.date_publication is None:
        projet.date_publication = datetime.now(UTC)
    return _saved(db, projet)


@router.get("/{projet_id}/apercu", response_model=PublicProjetDetail)
def preview_project(projet_id: int, db: Session = Depends(get_db)) -> PublicProjetDetail:
    """La fiche telle que la verra le visiteur, même si le projet est en brouillon."""
    return public_content.project_detail(get_or_404(db, Projet, projet_id), unlocked=True)


@router.get("/{projet_id}/versions", response_model=list[VersionOut])
def list_versions(projet_id: int, db: Session = Depends(get_db)) -> list[VersionProjet]:
    return get_or_404(db, Projet, projet_id).versions


@router.post("/{projet_id}/versions/{version_id}/restaurer", response_model=ProjetOut)
def restore_version(projet_id: int, version_id: int, db: Session = Depends(get_db)) -> ProjetOut:
    projet = get_or_404(db, Projet, projet_id)
    version = get_or_404(db, VersionProjet, version_id)
    if version.projet_id != projet.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "introuvable")
    data = ProjetIn.model_validate(version.contenu)
    # Une compétence supprimée depuis ne bloque pas la restauration.
    existing = set(
        db.scalars(select(Technologie.id).where(Technologie.id.in_(data.technologie_ids)))
    )
    data.technologie_ids = [item for item in data.technologie_ids if item in existing]
    projects.save_version(db, projet)
    projects.apply(db, projet, data)
    return _saved(db, projet)
