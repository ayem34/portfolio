"""Format du contenu publié : lu par le site public, le build statique et l'aperçu admin."""

from datetime import date, datetime

from app.enums import AccesCode, Categorie, Etat, Niveau, TypeMedia, TypeParcours
from app.schemas.common import LocalizedText, Schema
from app.schemas.content import ProfilSchema
from app.schemas.projet import ContenuProjet, DemoConfig, EtapeOut


class PublicMetier(Schema):
    slug: str
    nom: LocalizedText


class PublicProjetMetier(PublicMetier):
    pertinence: int


class PublicTechnologie(Schema):
    id: int
    nom: str
    domaine: LocalizedText
    niveau: Niveau
    # Slugs des projets publiés qui utilisent cette compétence (« projets qui prouvent »).
    projets: list[str] = []


class PublicProjetCard(Schema):
    slug: str
    titre: LocalizedText
    resume: LocalizedText
    categorie: Categorie
    etat: Etat
    acces_code: AccesCode
    est_phare: bool
    metiers: list[PublicProjetMetier]
    technologies: list[int]
    # Types de démo disponibles, du plus interactif au moins interactif.
    types_demo: list[str]
    # Niveau le plus élevé atteint sur l'échelle de preuves (0 = aucune preuve).
    niveau_demo: int
    image: str | None
    date_publication: datetime | None


class PublicMedia(Schema):
    id: int
    type: TypeMedia
    url: str
    legende: LocalizedText


class PublicDemo(Schema):
    id: int
    type: str
    url: str
    config: DemoConfig
    etapes: list[EtapeOut] = []


class PublicProjetDetail(PublicProjetCard):
    # True : projet confidentiel non déverrouillé, seul l'en-tête est fourni.
    protege: bool
    contenu: ContenuProjet | None
    technologies_detail: list[PublicTechnologie]
    galerie: list[PublicMedia]
    # Démo principale en premier, puis par niveau décroissant.
    demos: list[PublicDemo]


class PublicParcours(Schema):
    id: int
    type: TypeParcours
    titre: LocalizedText
    etablissement: str
    date_debut: date
    date_fin: date | None
    description: LocalizedText
    justificatif_url: str | None


class PublicSite(Schema):
    profil: ProfilSchema
    metiers: list[PublicMetier]
    projets: list[PublicProjetCard]
    technologies: list[PublicTechnologie]
    parcours: list[PublicParcours]
    genere_le: datetime
