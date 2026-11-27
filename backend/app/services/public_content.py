"""Mise en forme du contenu publié.

Une seule source pour le site public, le build statique et l'aperçu de l'admin :
l'aperçu d'un brouillon est donc exactement ce que verra le visiteur.
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.enums import AccesCode, StatutPublication, TypeDemo, TypeMedia
from app.models import Demo, Metier, Parcours, Profil, Projet, Technologie
from app.schemas.content import ProfilSchema
from app.schemas.public import (
    PublicDemo,
    PublicMedia,
    PublicMetierDetail,
    PublicParcours,
    PublicProjetCard,
    PublicProjetDetail,
    PublicProjetMetier,
    PublicSite,
    PublicTechnologie,
)

# Échelle de preuves (section 4.3). Le niveau 1 correspond aux captures de la galerie.
CAPTURES_LEVEL = 1
DEMO_LEVELS: dict[str, int] = {
    TypeDemo.LIEN_EXTERNE: 0,
    TypeDemo.VIDEO: 2,
    TypeDemo.VISITE: 3,
    TypeDemo.NOTEBOOK: 4,
    TypeDemo.PLAYGROUND: 5,
    TypeDemo.BAC_A_SABLE: 6,
}


def is_published(projet: Projet) -> bool:
    return projet.statut_publication == StatutPublication.PUBLIE


def published_projects(db: Session) -> list[Projet]:
    return list(
        db.scalars(
            select(Projet)
            .where(Projet.statut_publication == StatutPublication.PUBLIE)
            .order_by(Projet.ordre, Projet.id)
        )
    )


def _gallery(projet: Projet) -> list[PublicMedia]:
    return [
        PublicMedia.model_validate(media)
        for media in projet.medias
        if media.type == TypeMedia.IMAGE
    ]


def _sorted_demos(projet: Projet) -> list[Demo]:
    """Démo principale d'abord, puis de la plus interactive à la moins interactive."""
    return sorted(
        projet.demos,
        key=lambda demo: (not demo.est_principale, -DEMO_LEVELS[demo.type], demo.ordre),
    )


def _technology(technologie: Technologie, published_only: bool = True) -> PublicTechnologie:
    return PublicTechnologie(
        id=technologie.id,
        nom=technologie.nom,
        domaine=technologie.domaine,
        niveau=technologie.niveau,
        source=technologie.source,
        progression=technologie.progression,
        projets=[p.slug for p in technologie.projets if not published_only or is_published(p)],
    )


def _card_fields(projet: Projet) -> dict:
    confidential = projet.acces_code == AccesCode.CONFIDENTIEL
    gallery = _gallery(projet)
    demos = _sorted_demos(projet)
    levels = [DEMO_LEVELS[demo.type] for demo in demos]
    if gallery:
        levels.append(CAPTURES_LEVEL)
    return {
        "slug": projet.slug,
        "titre": projet.titre,
        "resume": projet.resume,
        "categorie": projet.categorie,
        "etat": projet.etat,
        "acces_code": projet.acces_code,
        "est_phare": projet.est_phare,
        "metiers": [
            PublicProjetMetier(
                slug=link.metier.slug, nom=link.metier.nom, pertinence=link.pertinence
            )
            for link in sorted(projet.metiers, key=lambda link: link.metier.ordre)
        ],
        "technologies": [technologie.id for technologie in projet.technologies],
        "types_demo": list(dict.fromkeys(demo.type for demo in demos)),
        "niveau_demo": max(levels, default=0),
        # L'image d'un projet confidentiel n'est jamais exposée sans code.
        "image": gallery[0].url if gallery and not confidential else None,
        "date_publication": projet.date_publication,
    }


def project_card(projet: Projet) -> PublicProjetCard:
    return PublicProjetCard(**_card_fields(projet))


def project_detail(projet: Projet, *, unlocked: bool = False) -> PublicProjetDetail:
    """Fiche complète. Projet confidentiel non déverrouillé : en-tête seulement."""
    protected = projet.acces_code == AccesCode.CONFIDENTIEL and not unlocked
    return PublicProjetDetail(
        **_card_fields(projet),
        protege=protected,
        contenu=None if protected else projet.contenu,
        technologies_detail=[_technology(technologie) for technologie in projet.technologies],
        galerie=[] if protected else _gallery(projet),
        demos=[]
        if protected
        else [PublicDemo.model_validate(demo) for demo in _sorted_demos(projet)],
    )


def site(db: Session) -> PublicSite:
    profil = db.get(Profil, 1)
    return PublicSite(
        profil=ProfilSchema.model_validate(profil) if profil else ProfilSchema(),
        metiers=[
            PublicMetierDetail.model_validate(metier)
            for metier in db.scalars(select(Metier).order_by(Metier.ordre))
        ],
        projets=[project_card(projet) for projet in published_projects(db)],
        technologies=[
            _technology(technologie)
            for technologie in db.scalars(
                select(Technologie).order_by(Technologie.ordre, Technologie.id)
            )
        ],
        parcours=[
            PublicParcours.model_validate(entry)
            for entry in db.scalars(select(Parcours).order_by(Parcours.date_debut.desc()))
        ],
        genere_le=datetime.now(UTC),
    )
