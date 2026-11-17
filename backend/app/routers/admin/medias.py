from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.enums import TypeMedia
from app.models import Demo, EtapeVisite, Media, Parcours, Profil, Projet
from app.routers.deps import apply_order, get_or_404, next_position
from app.schemas.common import OrderIn
from app.schemas.content import MediaOut, MediaUpdate
from app.services.storage import Storage, get_storage
from app.services.uploads import check_upload

router = APIRouter(prefix="/medias", tags=["admin : médias"])


def _project_medias(db: Session, projet_id: int) -> list[Media]:
    return list(db.scalars(select(Media).where(Media.projet_id == projet_id).order_by(Media.ordre)))


def _is_used(db: Session, url: str) -> bool:
    """Le fichier est-il encore affiché quelque part (visite, démo, CV, justificatif) ?"""
    checks = [
        select(EtapeVisite.id).where(EtapeVisite.image_url == url),
        select(Demo.id).where(Demo.url == url),
        select(Profil.id).where(Profil.cv_url == url),
        select(Parcours.id).where(Parcours.justificatif_url == url),
    ]
    return any(db.scalar(check.limit(1)) is not None for check in checks)


@router.get("", response_model=list[MediaOut])
def list_medias(
    projet_id: int | None = None,
    type: TypeMedia | None = None,  # noqa: A002  (nom du paramètre d'URL)
    q: str | None = None,
    db: Session = Depends(get_db),
) -> list[Media]:
    query = select(Media)
    if projet_id is not None:
        query = query.where(Media.projet_id == projet_id).order_by(Media.ordre, Media.id)
    else:
        query = query.order_by(Media.id.desc())
    if type is not None:
        query = query.where(Media.type == type)
    if q:
        query = query.where(Media.nom.ilike(f"%{q}%"))
    return list(db.scalars(query))


@router.post("", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
def upload_media(
    fichier: UploadFile = File(...),
    projet_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
) -> Media:
    if projet_id is not None:
        get_or_404(db, Projet, projet_id)
    checked = check_upload(fichier)
    url = storage.save(checked.name, checked.content, checked.rule.content_type)
    media = Media(
        projet_id=projet_id,
        type=checked.rule.media_type,
        url=url,
        nom=checked.original_name,
        taille=len(checked.content),
        legende={"fr": "", "en": ""},
        ordre=next_position(_project_medias(db, projet_id)) if projet_id is not None else 0,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@router.put("/ordre", status_code=status.HTTP_204_NO_CONTENT)
def reorder_medias(projet_id: int, data: OrderIn, db: Session = Depends(get_db)) -> None:
    apply_order(_project_medias(db, projet_id), data.ids)
    db.commit()


@router.put("/{media_id}", response_model=MediaOut)
def update_media(media_id: int, data: MediaUpdate, db: Session = Depends(get_db)) -> Media:
    media = get_or_404(db, Media, media_id)
    if data.projet_id is not None and data.projet_id != media.projet_id:
        get_or_404(db, Projet, data.projet_id)
        media.ordre = next_position(_project_medias(db, data.projet_id))
    media.projet_id = data.projet_id
    media.legende = data.legende.model_dump()
    db.commit()
    db.refresh(media)
    return media


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: int, db: Session = Depends(get_db), storage: Storage = Depends(get_storage)
) -> None:
    media = get_or_404(db, Media, media_id)
    if _is_used(db, media.url):
        raise HTTPException(status.HTTP_409_CONFLICT, "media_utilise")
    storage.delete(media.url)
    db.delete(media)
    db.commit()
