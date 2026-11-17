"""Écriture d'un projet et historique de ses versions."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Metier, Projet, ProjetMetier, Technologie, VersionProjet
from app.schemas.projet import ProjetIn

MAX_VERSIONS = 50


def to_schema(projet: Projet) -> ProjetIn:
    """État modifiable du projet : c'est aussi ce qui est copié dans l'historique."""
    return ProjetIn.model_validate(snapshot(projet))


def snapshot(projet: Projet) -> dict:
    return {
        "slug": projet.slug,
        "titre": projet.titre,
        "resume": projet.resume,
        "contenu": projet.contenu,
        "categorie": projet.categorie,
        "etat": projet.etat,
        "acces_code": projet.acces_code,
        "est_phare": projet.est_phare,
        "metiers": [
            {"metier_id": link.metier_id, "pertinence": link.pertinence} for link in projet.metiers
        ],
        "technologie_ids": [technologie.id for technologie in projet.technologies],
    }


def apply(db: Session, projet: Projet, data: ProjetIn) -> None:
    slug_owner = db.scalar(select(Projet.id).where(Projet.slug == data.slug))
    if slug_owner is not None and slug_owner != projet.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "slug_deja_utilise")

    metier_ids = {link.metier_id for link in data.metiers}
    known_metiers = set(db.scalars(select(Metier.id).where(Metier.id.in_(metier_ids))))
    technologies = list(
        db.scalars(select(Technologie).where(Technologie.id.in_(data.technologie_ids)))
    )
    if known_metiers != metier_ids or len(technologies) != len(set(data.technologie_ids)):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "reference_inconnue")

    projet.slug = data.slug
    projet.titre = data.titre.model_dump()
    projet.resume = data.resume.model_dump()
    projet.contenu = data.contenu.model_dump()
    projet.categorie = data.categorie
    projet.etat = data.etat
    projet.acces_code = data.acces_code
    projet.est_phare = data.est_phare
    projet.technologies = technologies

    pertinence_by_metier = {link.metier_id: link.pertinence for link in data.metiers}
    for link in list(projet.metiers):
        if link.metier_id in pertinence_by_metier:
            link.pertinence = pertinence_by_metier.pop(link.metier_id)
        else:
            projet.metiers.remove(link)
    for metier_id, pertinence in pertinence_by_metier.items():
        projet.metiers.append(ProjetMetier(metier_id=metier_id, pertinence=pertinence))


def save_version(db: Session, projet: Projet) -> None:
    """Copie l'état actuel dans l'historique, avant une modification."""
    content = to_schema(projet).model_dump(mode="json")
    db.add(VersionProjet(projet_id=projet.id, contenu=content))
    db.flush()
    old_versions = db.scalars(
        select(VersionProjet)
        .where(VersionProjet.projet_id == projet.id)
        .order_by(VersionProjet.id.desc())
        .offset(MAX_VERSIONS)
    )
    for version in old_versions:
        db.delete(version)
