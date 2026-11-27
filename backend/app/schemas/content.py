"""Compétences, parcours, profil, médias, messages, demandes d'accès, statistiques."""

from datetime import date, datetime
from typing import Literal

from pydantic import EmailStr, Field, field_validator, model_validator

from app.enums import (
    CouleurMetier,
    FigureMetier,
    Niveau,
    ObjetMessage,
    StatutDemande,
    TypeDemo,
    TypeMedia,
    TypeParcours,
)
from app.schemas.common import LocalizedText, Schema, Url


class OffreMetier(Schema):
    """Ce que le métier apporte à un client (page À propos, « Pour vos projets »)."""

    titre: LocalizedText = LocalizedText()
    texte: LocalizedText = LocalizedText()


class MetierIn(Schema):
    nom: LocalizedText
    description: LocalizedText = LocalizedText()
    offre: OffreMetier = OffreMetier()
    figure: FigureMetier = FigureMetier.APPLICATION
    couleur: CouleurMetier = CouleurMetier.CORAIL

    @model_validator(mode="after")
    def name_required(self) -> "MetierIn":
        if not self.nom.fr:
            raise ValueError("nom_fr_requis")
        return self


class MetierOut(MetierIn):
    id: int
    slug: str


class TechnologieIn(Schema):
    nom: str = Field(min_length=1, max_length=120)
    domaine: LocalizedText
    niveau: Niveau = Niveau.NOTIONS
    # Utiles tant qu'aucun projet publié ne prouve la compétence (« en cours d'apprentissage »).
    source: LocalizedText = LocalizedText()
    progression: int = Field(default=1, ge=1, le=3)


class TechnologieOut(TechnologieIn):
    id: int
    ordre: int
    nb_projets: int = 0


class ParcoursIn(Schema):
    type: TypeParcours
    titre: LocalizedText
    etablissement: str = Field(default="", max_length=255)
    date_debut: date
    date_fin: date | None = None
    description: LocalizedText = LocalizedText()
    justificatif_url: Url | None = None

    @model_validator(mode="after")
    def dates_in_order(self) -> "ParcoursIn":
        if self.date_fin and self.date_fin < self.date_debut:
            raise ValueError("dates_inversees")
        return self


class ParcoursOut(ParcoursIn):
    id: int


class Presentation(Schema):
    accroche: LocalizedText = LocalizedText()
    profil: LocalizedText = LocalizedText()
    orientation: LocalizedText = LocalizedText()
    methode: LocalizedText = LocalizedText()
    # Grand titre de la page À propos ; les mots entre **…** sont mis en valeur.
    slogan: LocalizedText = LocalizedText()
    # Ex. « à partir de février 2027 » ; vide = pas de badge « Disponible ».
    disponibilite: LocalizedText = LocalizedText()
    localisation: LocalizedText = LocalizedText()


class LiensProfil(Schema):
    linkedin: Url = ""
    github: Url = ""


class ProfilSchema(Schema):
    nom: str = Field(default="", max_length=255)
    titre: LocalizedText = LocalizedText()
    presentation: Presentation = Presentation()
    email: EmailStr | Literal[""] = ""
    liens: LiensProfil = LiensProfil()
    cv_url: Url | None = None


class MediaUpdate(Schema):
    legende: LocalizedText = LocalizedText()
    projet_id: int | None = None


class MediaOut(Schema):
    id: int
    projet_id: int | None
    type: TypeMedia
    url: str
    legende: LocalizedText
    ordre: int
    nom: str
    taille: int
    date: datetime


class ContactIn(Schema):
    objet: ObjetMessage = ObjetMessage.AUTRE
    nom: str = Field(min_length=1, max_length=120)
    entreprise: str = Field(default="", max_length=160)
    email: EmailStr
    contenu: str = Field(min_length=10, max_length=5000)
    # Champ piège : invisible pour un humain, rempli par les robots.
    site_web: str = ""


class MessageOut(Schema):
    id: int
    objet: ObjetMessage
    nom: str
    entreprise: str
    email: str
    contenu: str
    traite: bool
    date: datetime


class MessageUpdate(Schema):
    traite: bool


class DemandeAccesIn(Schema):
    nom: str = Field(min_length=1, max_length=120)
    entreprise: str = Field(min_length=1, max_length=160)
    email: EmailStr
    motif: str = Field(min_length=10, max_length=2000)
    site_web: str = ""


class DemandeAccesOut(Schema):
    id: int
    projet_id: int
    projet_slug: str
    projet_titre: LocalizedText
    nom: str
    entreprise: str
    email: str
    motif: str
    statut: StatutDemande
    expire_le: datetime | None
    date: datetime
    date_decision: datetime | None
    nb_consultations: int = 0


class DemandeAccepteeOut(DemandeAccesOut):
    """Le code n'est visible qu'une fois, à l'acceptation ; seule son empreinte est stockée."""

    code: str


class ConsultationIn(Schema):
    slug: str
    type_demo: TypeDemo | Literal["captures"] | None = None
    metier_choisi: str | None = Field(default=None, max_length=60)


class ConsultationOut(Schema):
    id: int
    type_demo: str | None
    metier_choisi: str | None
    date: datetime


class AccesIn(Schema):
    code: str = Field(min_length=4, max_length=40)

    @field_validator("code")
    @classmethod
    def normalize(cls, value: str) -> str:
        return value.replace(" ", "").upper()


class LoginIn(Schema):
    email: EmailStr
    mot_de_passe: str = Field(min_length=1, max_length=200)


class AdminOut(Schema):
    email: str
    derniere_connexion: datetime | None


class StatProjet(Schema):
    projet_id: int
    slug: str
    titre: LocalizedText
    vues: int
    demos_lancees: int


class StatCompteur(Schema):
    cle: str
    total: int


class StatistiquesOut(Schema):
    jours: int
    total_vues: int
    total_demos_lancees: int
    vues_par_projet: list[StatProjet]
    demos_lancees: list[StatCompteur]
    metiers_choisis: list[StatCompteur]
    messages_non_traites: int
    demandes_en_attente: int
    derniers_messages: list[MessageOut]
    dernieres_demandes: list[DemandeAccesOut]


class PublicationOut(Schema):
    configuree: bool
    site_url: str


class PublicationResult(Schema):
    declenchee: bool
