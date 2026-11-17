from datetime import datetime
from typing import Annotated, Literal

from pydantic import Field, field_validator, model_validator

from app.enums import AccesCode, Categorie, Etat, StatutPublication, TypeDemo
from app.schemas.common import LocalizedText, RequiredUrl, Schema, Url

Slug = Annotated[str, Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=120)]


class Chiffre(Schema):
    valeur: str = Field(max_length=40)
    libelle: LocalizedText = LocalizedText()


class Methode(Schema):
    regles_metier: LocalizedText = LocalizedText()
    architecture: LocalizedText = LocalizedText()
    modele_donnees: LocalizedText = LocalizedText()
    parcours_utilisateur: LocalizedText = LocalizedText()
    decisions: LocalizedText = LocalizedText()


class Liens(Schema):
    github: Url = ""
    demo: Url = ""
    documentation: Url = ""
    rapport: Url = ""


class ContenuProjet(Schema):
    """Sections de la fiche projet (section 4.1 de la conception)."""

    contexte: LocalizedText = LocalizedText()
    objectifs: LocalizedText = LocalizedText()
    resultats: LocalizedText = LocalizedText()
    chiffres: list[Chiffre] = []
    methode: Methode = Methode()
    difficultes: LocalizedText = LocalizedText()
    apprentissages: LocalizedText = LocalizedText()
    liens: Liens = Liens()


class ProjetMetierIn(Schema):
    metier_id: int
    pertinence: int = Field(default=1, ge=1, le=3)


class ProjetIn(Schema):
    slug: Slug
    titre: LocalizedText
    resume: LocalizedText = LocalizedText()
    contenu: ContenuProjet = ContenuProjet()
    categorie: Categorie = Categorie.PERSONNEL
    etat: Etat = Etat.EN_COURS
    acces_code: AccesCode = AccesCode.PUBLIC
    est_phare: bool = False
    metiers: list[ProjetMetierIn] = []
    technologie_ids: list[int] = []

    @model_validator(mode="after")
    def title_required(self) -> "ProjetIn":
        if not self.titre.fr:
            raise ValueError("titre_fr_requis")
        return self


class ProjetOut(ProjetIn):
    id: int
    ordre: int
    statut_publication: StatutPublication
    date_creation: datetime
    date_modification: datetime
    date_publication: datetime | None


class StatutIn(Schema):
    statut: StatutPublication


class VersionOut(Schema):
    id: int
    date: datetime
    contenu: ProjetIn


# --- Démos ---


class Zone(Schema):
    """Zone cliquable, en pourcentage de l'image (compatible mobile)."""

    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    largeur: float = Field(gt=0, le=100)
    hauteur: float = Field(gt=0, le=100)

    @model_validator(mode="after")
    def inside_image(self) -> "Zone":
        if self.x + self.largeur > 100.01 or self.y + self.hauteur > 100.01:
            raise ValueError("zone_hors_image")
        return self


class EtapeIn(Schema):
    image_url: RequiredUrl
    # Sans zone (dernier écran, par exemple), le visiteur avance avec « Suivant ».
    zone: Zone | None = None
    legende: LocalizedText = LocalizedText()

    @field_validator("zone", mode="before")
    @classmethod
    def empty_zone_is_none(cls, value: object) -> object:
        return value or None


class EtapeOut(EtapeIn):
    id: int
    ordre: int


class RoleBacASable(Schema):
    cle: str = Field(min_length=1, max_length=60, pattern=r"^[A-Za-z0-9_-]+$")
    libelle: LocalizedText


class SousTitres(Schema):
    fr: Url = ""
    en: Url = ""


class DemoConfig(Schema):
    """Réglages selon le type : cadre (visite), rôles et adresse (bac à sable),
    sous-titres (vidéo). Le titre est facultatif pour tous les types."""

    titre: LocalizedText = LocalizedText()
    cadre: Literal["navigateur", "telephone", "aucun"] = "navigateur"
    adresse_connexion: Url = ""
    roles: list[RoleBacASable] = []
    sous_titres: SousTitres = SousTitres()


class DemoIn(Schema):
    type: TypeDemo
    url: Url = ""
    config: DemoConfig = DemoConfig()
    est_principale: bool = False


class DemoOut(DemoIn):
    id: int
    projet_id: int
    ordre: int
    etapes: list[EtapeOut] = []
