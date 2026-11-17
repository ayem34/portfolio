"""Contenu d'exemple créé au premier démarrage (SEED_EXAMPLE_CONTENT=true).

Tout est fictif, marqué « Exemple » et laissé en BROUILLON : rien n'apparaît sur le
site public. Les trois projets montrent chaque type de démo (dont une visite guidée
complète) pour servir de modèle dans l'admin. Ils peuvent être supprimés sans risque.

Seuls des projets sont créés : compétences, parcours et profil n'ont pas de statut
« brouillon » et seraient visibles immédiatement.
"""

import logging
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.enums import AccesCode, Categorie, Etat, TypeDemo, TypeMedia
from app.models import Demo, EtapeVisite, Media, Metier, Projet
from app.schemas.projet import DemoConfig, ProjetIn
from app.services import projects
from app.services.storage import Storage

logger = logging.getLogger("bootstrap")
ASSETS = Path(__file__).parent / "example_assets"

CONTENT_TYPES = {
    ".png": (TypeMedia.IMAGE, "image/png"),
    ".mp4": (TypeMedia.VIDEO, "video/mp4"),
    ".html": (TypeMedia.NOTEBOOK, "text/html"),
    ".vtt": (TypeMedia.SOUS_TITRES, "text/vtt"),
}


def text(fr: str, en: str) -> dict[str, str]:
    return {"fr": fr, "en": en}


NOTICE = text(
    "**Exemple fictif.** Ce texte montre où s'affiche cette rubrique : remplacez-le par le vôtre.",
    "**Fictitious example.** This text shows where this section appears: replace it with yours.",
)


def _section(fr: str, en: str) -> dict[str, str]:
    return text(f"{NOTICE['fr']}\n\n{fr}", f"{NOTICE['en']}\n\n{en}")


class ExampleBuilder:
    def __init__(self, db: Session, storage: Storage) -> None:
        self.db = db
        self.storage = storage
        self.metiers = {metier.slug: metier.id for metier in db.scalars(select(Metier))}

    def upload(self, filename: str, projet: Projet | None = None, legende=None) -> str:
        """Importe un fichier d'exemple dans le stockage et la bibliothèque de médias."""
        path = ASSETS / filename
        media_type, content_type = CONTENT_TYPES[path.suffix]
        content = path.read_bytes()
        url = self.storage.save(f"{uuid.uuid4().hex}{path.suffix}", content, content_type)
        self.db.add(
            Media(
                projet=projet,
                type=media_type,
                url=url,
                nom=f"exemple-{filename}",
                taille=len(content),
                legende=legende or text("", ""),
                ordre=len(projet.medias) if projet else 0,
            )
        )
        return url

    def project(self, ordre: int, metier: str, **fields) -> Projet:
        data = ProjetIn(metiers=[{"metier_id": self.metiers[metier], "pertinence": 3}], **fields)
        projet = Projet(ordre=ordre)
        projects.apply(self.db, projet, data)
        self.db.add(projet)
        return projet

    def demo(self, projet: Projet, type_demo: TypeDemo, url: str = "", **config) -> Demo:
        demo = Demo(
            type=type_demo,
            url=url,
            config=DemoConfig(**config).model_dump(),
            ordre=len(projet.demos),
        )
        projet.demos.append(demo)
        return demo


def _carpooling(build: ExampleBuilder) -> None:
    projet = build.project(
        0,
        "full-stack",
        slug="exemple-application-de-covoiturage",
        titre=text("Exemple — Application de covoiturage", "Example — Carpooling app"),
        resume=text(
            "Projet fictif qui montre une fiche complète : visite guidée, vidéo et bac à sable.",
            "Fictitious project showing a complete page: guided tour, video and live sandbox.",
        ),
        categorie=Categorie.COLLABORATIF,
        etat=Etat.EN_COURS,
        acces_code=AccesCode.PRIVE,
        est_phare=True,
        contenu={
            "contexte": _section(
                "Décrivez ici le besoin de départ et la problématique.",
                "Describe the initial need and the problem here.",
            ),
            "objectifs": _section("- Objectif 1\n- Objectif 2", "- Goal 1\n- Goal 2"),
            "resultats": _section(
                "Résultats obtenus, chiffrés quand c'est possible.",
                "Results achieved, with figures whenever possible.",
            ),
            "chiffres": [
                {"valeur": "12", "libelle": text("écrans (exemple)", "screens (example)")},
                {"valeur": "3", "libelle": text("rôles (exemple)", "roles (example)")},
            ],
            "methode": {
                "regles_metier": _section(
                    "Les règles métier retenues.", "The business rules that were chosen."
                ),
                "architecture": _section(
                    "Le schéma d'architecture (image insérée depuis Médias).",
                    "The architecture diagram (image inserted from Media).",
                ),
                "modele_donnees": _section("Le modèle de données.", "The data model."),
                "parcours_utilisateur": _section(
                    "Le parcours d'un utilisateur, étape par étape.",
                    "A user's journey, step by step.",
                ),
                "decisions": _section(
                    "Les décisions prises et leur raison.", "The decisions made and why."
                ),
            },
            "difficultes": _section("Ce qui a été difficile.", "What was difficult."),
            "apprentissages": _section("Ce que ce projet a appris.", "What this project taught."),
        },
    )
    for index, (fr, en) in enumerate(
        [
            ("Recherche d'un trajet (exemple)", "Trip search (example)"),
            ("Résultats (exemple)", "Results (example)"),
        ],
        start=1,
    ):
        build.upload(f"capture-{index}.png", projet, text(fr, en))

    tour = build.demo(projet, TypeDemo.VISITE, cadre="telephone")
    tour.est_principale = True
    steps = [
        (
            "Touchez « Rechercher un trajet » pour lancer la recherche.",
            "Tap “Rechercher un trajet” to start the search.",
            {"x": 5, "y": 30, "largeur": 90, "hauteur": 7.5},
        ),
        (
            "Choisissez un départ puis touchez « Réserver ».",
            "Pick a departure, then tap “Réserver”.",
            {"x": 5, "y": 30, "largeur": 90, "hauteur": 7.5},
        ),
        (
            "Le trajet est réservé : fin de la visite (données fictives).",
            "The trip is booked: end of the tour (fictitious data).",
            {},
        ),
    ]
    for index, (fr, en, zone) in enumerate(steps):
        tour.etapes.append(
            EtapeVisite(
                ordre=index,
                image_url=build.upload(f"ecran-{index + 1}.png"),
                zone=zone,
                legende=text(fr, en),
            )
        )

    build.demo(
        projet,
        TypeDemo.VIDEO,
        build.upload("video.mp4"),
        sous_titres={
            "fr": build.upload("sous-titres-fr.vtt"),
            "en": build.upload("sous-titres-en.vtt"),
        },
    )
    # Adresses en « .invalid » : elles n'existent pas, la fiche affiche donc le message
    # d'attente et propose la visite guidée, comme quand un vrai serveur est en veille.
    build.demo(
        projet,
        TypeDemo.BAC_A_SABLE,
        "https://demo.exemple.invalid",
        adresse_connexion="https://demo.exemple.invalid/demo/login",
        roles=[
            {"cle": "passager", "libelle": text("passager", "a passenger")},
            {"cle": "conducteur", "libelle": text("conducteur", "a driver")},
        ],
    )


def _sentiment(build: ExampleBuilder) -> None:
    projet = build.project(
        1,
        "data-analyst",
        slug="exemple-analyse-de-sentiments",
        titre=text("Exemple — Analyse de sentiments", "Example — Sentiment analysis"),
        resume=text(
            "Projet fictif qui montre un notebook publié, un playground et un lien externe.",
            "Fictitious project showing a published notebook, a playground and an external link.",
        ),
        categorie=Categorie.ACADEMIQUE,
        etat=Etat.TERMINE,
        acces_code=AccesCode.PUBLIC,
        contenu={
            "contexte": _section(
                "Un projet Data se présente avec son notebook et, si possible, un playground.",
                "A data project comes with its notebook and, if possible, a playground.",
            ),
            "chiffres": [{"valeur": "0,00", "libelle": text("Score F1 (exemple)", "F1 (example)")}],
        },
    )
    build.demo(projet, TypeDemo.NOTEBOOK, build.upload("notebook.html"))
    # Sans adresse, le playground affiche « indisponible » : saisir l'adresse du Space.
    build.demo(projet, TypeDemo.PLAYGROUND)
    build.demo(
        projet,
        TypeDemo.LIEN_EXTERNE,
        "https://example.com",
        titre=text("Démo de secours (exemple)", "Fallback demo (example)"),
    )


def _client_case(build: ExampleBuilder) -> None:
    projet = build.project(
        2,
        "data-engineer",
        slug="exemple-etude-de-cas-client",
        titre=text("Exemple — Étude de cas client", "Example — Client case study"),
        resume=text(
            "Projet fictif « confidentiel » : la fiche publique ne montre que cet en-tête.",
            "Fictitious “confidential” project: the public page only shows this header.",
        ),
        categorie=Categorie.COLLABORATIF,
        etat=Etat.PROTOTYPE,
        acces_code=AccesCode.CONFIDENTIEL,
        contenu={
            "contexte": _section(
                "Ce contenu n'est visible qu'avec un code d'accès accordé depuis l'admin.",
                "This content is only visible with an access code granted from the admin.",
            )
        },
    )
    tour = build.demo(projet, TypeDemo.VISITE, cadre="navigateur")
    tour.etapes.append(
        EtapeVisite(
            ordre=0,
            image_url=build.upload("capture-1.png"),
            zone={},
            legende=text(
                "Écran d'exemple sur données fictives.", "Example screen, fictitious data."
            ),
        )
    )


def seed_example_content(db: Session, storage: Storage) -> bool:
    """Crée les projets d'exemple si la base ne contient encore aucun projet."""
    if db.scalar(select(Projet.id).limit(1)) is not None:
        return False
    build = ExampleBuilder(db, storage)
    for create in (_carpooling, _sentiment, _client_case):
        create(build)
    logger.info("Contenu d'exemple créé (3 projets fictifs, en brouillon).")
    return True
