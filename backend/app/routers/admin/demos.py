"""Démos d'un projet et étapes des visites guidées."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.enums import TypeDemo
from app.models import Demo, EtapeVisite, Projet
from app.routers.deps import apply_order, get_or_404, next_position
from app.schemas.common import OrderIn
from app.schemas.projet import DemoIn, DemoOut, EtapeIn, EtapeOut

router = APIRouter(tags=["admin : démos et visites guidées"])


def _apply_demo(demo: Demo, data: DemoIn, projet: Projet) -> None:
    demo.type = data.type
    demo.url = data.url
    demo.config = data.config.model_dump()
    demo.est_principale = data.est_principale
    if data.est_principale:
        # Une seule démo principale par projet.
        for other in projet.demos:
            if other is not demo:
                other.est_principale = False


def _apply_step(step: EtapeVisite, data: EtapeIn) -> None:
    step.image_url = data.image_url
    step.zone = data.zone.model_dump() if data.zone else {}
    step.legende = data.legende.model_dump()


def _saved(db: Session, item):
    db.commit()
    db.refresh(item)
    return item


@router.get("/projets/{projet_id}/demos", response_model=list[DemoOut])
def list_demos(projet_id: int, db: Session = Depends(get_db)) -> list[Demo]:
    return get_or_404(db, Projet, projet_id).demos


@router.post(
    "/projets/{projet_id}/demos", response_model=DemoOut, status_code=status.HTTP_201_CREATED
)
def create_demo(projet_id: int, data: DemoIn, db: Session = Depends(get_db)) -> Demo:
    projet = get_or_404(db, Projet, projet_id)
    demo = Demo(ordre=next_position(projet.demos))
    _apply_demo(demo, data, projet)
    projet.demos.append(demo)
    return _saved(db, demo)


@router.put("/demos/{demo_id}", response_model=DemoOut)
def update_demo(demo_id: int, data: DemoIn, db: Session = Depends(get_db)) -> Demo:
    demo = get_or_404(db, Demo, demo_id)
    if data.type != demo.type and demo.etapes:
        raise HTTPException(status.HTTP_409_CONFLICT, "visite_avec_etapes")
    _apply_demo(demo, data, demo.projet)
    return _saved(db, demo)


@router.delete("/demos/{demo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_demo(demo_id: int, db: Session = Depends(get_db)) -> None:
    db.delete(get_or_404(db, Demo, demo_id))
    db.commit()


def _tour(db: Session, demo_id: int) -> Demo:
    demo = get_or_404(db, Demo, demo_id)
    if demo.type != TypeDemo.VISITE:
        raise HTTPException(status.HTTP_409_CONFLICT, "demo_sans_etapes")
    return demo


@router.get("/demos/{demo_id}/etapes", response_model=list[EtapeOut])
def list_steps(demo_id: int, db: Session = Depends(get_db)) -> list[EtapeVisite]:
    return _tour(db, demo_id).etapes


@router.post(
    "/demos/{demo_id}/etapes", response_model=EtapeOut, status_code=status.HTTP_201_CREATED
)
def create_step(demo_id: int, data: EtapeIn, db: Session = Depends(get_db)) -> EtapeVisite:
    demo = _tour(db, demo_id)
    step = EtapeVisite(ordre=next_position(demo.etapes))
    _apply_step(step, data)
    demo.etapes.append(step)
    return _saved(db, step)


@router.put("/demos/{demo_id}/etapes/ordre", status_code=status.HTTP_204_NO_CONTENT)
def reorder_steps(demo_id: int, data: OrderIn, db: Session = Depends(get_db)) -> None:
    apply_order(_tour(db, demo_id).etapes, data.ids)
    db.commit()


@router.put("/etapes/{etape_id}", response_model=EtapeOut)
def update_step(etape_id: int, data: EtapeIn, db: Session = Depends(get_db)) -> EtapeVisite:
    step = get_or_404(db, EtapeVisite, etape_id)
    _apply_step(step, data)
    return _saved(db, step)


@router.delete("/etapes/{etape_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step(etape_id: int, db: Session = Depends(get_db)) -> None:
    db.delete(get_or_404(db, EtapeVisite, etape_id))
    db.commit()
