"""Profil, métiers, compétences et parcours."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Metier, Parcours, Profil, Technologie
from app.routers.deps import apply_order, get_or_404, next_position
from app.schemas.common import OrderIn
from app.schemas.content import (
    MetierOut,
    ParcoursIn,
    ParcoursOut,
    ProfilSchema,
    TechnologieIn,
    TechnologieOut,
)

router = APIRouter(tags=["admin : profil, compétences, parcours"])


def _saved(db: Session, item):
    db.commit()
    db.refresh(item)
    return item


# --- Profil et métiers ---


@router.get("/profil", response_model=ProfilSchema)
def get_profile(db: Session = Depends(get_db)) -> Profil:
    return get_or_404(db, Profil, 1)


@router.put("/profil", response_model=ProfilSchema)
def update_profile(data: ProfilSchema, db: Session = Depends(get_db)) -> Profil:
    profil = get_or_404(db, Profil, 1)
    for field, value in data.model_dump().items():
        setattr(profil, field, value)
    return _saved(db, profil)


@router.get("/metiers", response_model=list[MetierOut])
def list_metiers(db: Session = Depends(get_db)) -> list[Metier]:
    return list(db.scalars(select(Metier).order_by(Metier.ordre)))


# --- Compétences ---


def _all_technologies(db: Session) -> list[Technologie]:
    return list(db.scalars(select(Technologie).order_by(Technologie.ordre, Technologie.id)))


def _technology_out(technologie: Technologie) -> TechnologieOut:
    out = TechnologieOut.model_validate(technologie)
    out.nb_projets = len(technologie.projets)
    return out


def _apply_technology(db: Session, technologie: Technologie, data: TechnologieIn) -> None:
    owner = db.scalar(select(Technologie.id).where(Technologie.nom == data.nom))
    if owner is not None and owner != technologie.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "nom_deja_utilise")
    technologie.nom = data.nom
    technologie.domaine = data.domaine.model_dump()
    technologie.niveau = data.niveau


@router.get("/technologies", response_model=list[TechnologieOut])
def list_technologies(db: Session = Depends(get_db)) -> list[TechnologieOut]:
    return [_technology_out(technologie) for technologie in _all_technologies(db)]


@router.post("/technologies", response_model=TechnologieOut, status_code=status.HTTP_201_CREATED)
def create_technology(data: TechnologieIn, db: Session = Depends(get_db)) -> TechnologieOut:
    technologie = Technologie(ordre=next_position(_all_technologies(db)))
    _apply_technology(db, technologie, data)
    db.add(technologie)
    return _technology_out(_saved(db, technologie))


@router.put("/technologies/ordre", status_code=status.HTTP_204_NO_CONTENT)
def reorder_technologies(data: OrderIn, db: Session = Depends(get_db)) -> None:
    apply_order(_all_technologies(db), data.ids)
    db.commit()


@router.put("/technologies/{technologie_id}", response_model=TechnologieOut)
def update_technology(
    technologie_id: int, data: TechnologieIn, db: Session = Depends(get_db)
) -> TechnologieOut:
    technologie = get_or_404(db, Technologie, technologie_id)
    _apply_technology(db, technologie, data)
    return _technology_out(_saved(db, technologie))


@router.delete("/technologies/{technologie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_technology(technologie_id: int, db: Session = Depends(get_db)) -> None:
    db.delete(get_or_404(db, Technologie, technologie_id))
    db.commit()


# --- Parcours ---


def _apply_timeline_entry(entry: Parcours, data: ParcoursIn) -> None:
    for field, value in data.model_dump().items():
        setattr(entry, field, value)


@router.get("/parcours", response_model=list[ParcoursOut])
def list_timeline(db: Session = Depends(get_db)) -> list[Parcours]:
    return list(db.scalars(select(Parcours).order_by(Parcours.date_debut.desc(), Parcours.id)))


@router.post("/parcours", response_model=ParcoursOut, status_code=status.HTTP_201_CREATED)
def create_timeline_entry(data: ParcoursIn, db: Session = Depends(get_db)) -> Parcours:
    entry = Parcours()
    _apply_timeline_entry(entry, data)
    db.add(entry)
    return _saved(db, entry)


@router.put("/parcours/{parcours_id}", response_model=ParcoursOut)
def update_timeline_entry(
    parcours_id: int, data: ParcoursIn, db: Session = Depends(get_db)
) -> Parcours:
    entry = get_or_404(db, Parcours, parcours_id)
    _apply_timeline_entry(entry, data)
    return _saved(db, entry)


@router.delete("/parcours/{parcours_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timeline_entry(parcours_id: int, db: Session = Depends(get_db)) -> None:
    db.delete(get_or_404(db, Parcours, parcours_id))
    db.commit()
