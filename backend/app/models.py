"""Les 15 tables du portfolio (section 7 de docs/conception.md).

Les textes traduisibles sont des JSON {"fr": "...", "en": "..."}.
"""

from datetime import date as date_type
from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.enums import (
    AccesCode,
    Categorie,
    Etat,
    Niveau,
    StatutDemande,
    StatutPublication,
    TypeDemo,
    TypeMedia,
    TypeParcours,
)

JsonDict = dict[str, Any]


def enum_column(enum_class: type[StrEnum]) -> SqlEnum:
    """Colonne texte limitée aux valeurs de l'énumération (contrainte CHECK)."""
    return SqlEnum(
        enum_class,
        native_enum=False,
        length=30,
        create_constraint=True,
        values_callable=lambda members: [member.value for member in members],
        name=f"ck_{enum_class.__name__.lower()}",
    )


def created_at() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now())


class Admin(Base):
    __tablename__ = "admin"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    mot_de_passe_hash: Mapped[str] = mapped_column(String(255))
    derniere_connexion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Profil(Base):
    """Une seule ligne (id = 1)."""

    __tablename__ = "profil"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(255), default="")
    titre: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    presentation: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    email: Mapped[str] = mapped_column(String(255), default="")
    liens: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    cv_url: Mapped[str | None] = mapped_column(String(1000))


class Projet(Base):
    __tablename__ = "projet"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    titre: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    resume: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    contenu: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    categorie: Mapped[Categorie] = mapped_column(
        enum_column(Categorie), default=Categorie.PERSONNEL
    )
    etat: Mapped[Etat] = mapped_column(enum_column(Etat), default=Etat.EN_COURS)
    acces_code: Mapped[AccesCode] = mapped_column(enum_column(AccesCode), default=AccesCode.PUBLIC)
    est_phare: Mapped[bool] = mapped_column(Boolean, default=False)
    ordre: Mapped[int] = mapped_column(Integer, default=0)
    statut_publication: Mapped[StatutPublication] = mapped_column(
        enum_column(StatutPublication), default=StatutPublication.BROUILLON, index=True
    )
    date_creation: Mapped[datetime] = created_at()
    date_modification: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    date_publication: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    metiers: Mapped[list["ProjetMetier"]] = relationship(
        back_populates="projet", cascade="all, delete-orphan"
    )
    technologies: Mapped[list["Technologie"]] = relationship(
        secondary="projet_technologie", back_populates="projets", order_by="Technologie.ordre"
    )
    medias: Mapped[list["Media"]] = relationship(back_populates="projet", order_by="Media.ordre")
    demos: Mapped[list["Demo"]] = relationship(
        back_populates="projet", cascade="all, delete-orphan", order_by="Demo.ordre"
    )
    versions: Mapped[list["VersionProjet"]] = relationship(
        back_populates="projet", cascade="all, delete-orphan", order_by="VersionProjet.id.desc()"
    )


class VersionProjet(Base):
    __tablename__ = "version_projet"

    id: Mapped[int] = mapped_column(primary_key=True)
    projet_id: Mapped[int] = mapped_column(ForeignKey("projet.id", ondelete="CASCADE"), index=True)
    contenu: Mapped[JsonDict] = mapped_column(JSON)
    date: Mapped[datetime] = created_at()

    projet: Mapped[Projet] = relationship(back_populates="versions")


class Metier(Base):
    __tablename__ = "metier"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True)
    nom: Mapped[JsonDict] = mapped_column(JSON)
    ordre: Mapped[int] = mapped_column(Integer, default=0)


class ProjetMetier(Base):
    __tablename__ = "projet_metier"

    projet_id: Mapped[int] = mapped_column(
        ForeignKey("projet.id", ondelete="CASCADE"), primary_key=True
    )
    metier_id: Mapped[int] = mapped_column(
        ForeignKey("metier.id", ondelete="CASCADE"), primary_key=True
    )
    pertinence: Mapped[int] = mapped_column(Integer, default=1)

    projet: Mapped[Projet] = relationship(back_populates="metiers")
    metier: Mapped[Metier] = relationship()


class Technologie(Base):
    __tablename__ = "technologie"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(120), unique=True)
    domaine: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    niveau: Mapped[Niveau] = mapped_column(enum_column(Niveau), default=Niveau.NOTIONS)
    ordre: Mapped[int] = mapped_column(Integer, default=0)

    projets: Mapped[list[Projet]] = relationship(
        secondary="projet_technologie", back_populates="technologies", order_by="Projet.ordre"
    )


class ProjetTechnologie(Base):
    __tablename__ = "projet_technologie"

    projet_id: Mapped[int] = mapped_column(
        ForeignKey("projet.id", ondelete="CASCADE"), primary_key=True
    )
    technologie_id: Mapped[int] = mapped_column(
        ForeignKey("technologie.id", ondelete="CASCADE"), primary_key=True
    )


class Media(Base):
    __tablename__ = "media"

    id: Mapped[int] = mapped_column(primary_key=True)
    projet_id: Mapped[int | None] = mapped_column(
        ForeignKey("projet.id", ondelete="SET NULL"), index=True
    )
    type: Mapped[TypeMedia] = mapped_column(enum_column(TypeMedia))
    url: Mapped[str] = mapped_column(String(1000))
    legende: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    ordre: Mapped[int] = mapped_column(Integer, default=0)
    nom: Mapped[str] = mapped_column(String(255), default="")
    taille: Mapped[int] = mapped_column(Integer, default=0)
    date: Mapped[datetime] = created_at()

    projet: Mapped[Projet | None] = relationship(back_populates="medias")


class Demo(Base):
    __tablename__ = "demo"

    id: Mapped[int] = mapped_column(primary_key=True)
    projet_id: Mapped[int] = mapped_column(ForeignKey("projet.id", ondelete="CASCADE"), index=True)
    type: Mapped[TypeDemo] = mapped_column(enum_column(TypeDemo))
    url: Mapped[str] = mapped_column(String(1000), default="")
    config: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    est_principale: Mapped[bool] = mapped_column(Boolean, default=False)
    ordre: Mapped[int] = mapped_column(Integer, default=0)

    projet: Mapped[Projet] = relationship(back_populates="demos")
    etapes: Mapped[list["EtapeVisite"]] = relationship(
        back_populates="demo", cascade="all, delete-orphan", order_by="EtapeVisite.ordre"
    )


class EtapeVisite(Base):
    __tablename__ = "etape_visite"

    id: Mapped[int] = mapped_column(primary_key=True)
    demo_id: Mapped[int] = mapped_column(ForeignKey("demo.id", ondelete="CASCADE"), index=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str] = mapped_column(String(1000))
    zone: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    legende: Mapped[JsonDict] = mapped_column(JSON, default=dict)

    demo: Mapped[Demo] = relationship(back_populates="etapes")


class Parcours(Base):
    __tablename__ = "parcours"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[TypeParcours] = mapped_column(enum_column(TypeParcours))
    titre: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    etablissement: Mapped[str] = mapped_column(String(255), default="")
    date_debut: Mapped[date_type] = mapped_column(Date)
    date_fin: Mapped[date_type | None] = mapped_column(Date)
    description: Mapped[JsonDict] = mapped_column(JSON, default=dict)
    justificatif_url: Mapped[str | None] = mapped_column(String(1000))


class Message(Base):
    __tablename__ = "message"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    contenu: Mapped[str] = mapped_column(Text)
    traite: Mapped[bool] = mapped_column(Boolean, default=False)
    date: Mapped[datetime] = created_at()


class DemandeAcces(Base):
    __tablename__ = "demande_acces"

    id: Mapped[int] = mapped_column(primary_key=True)
    projet_id: Mapped[int] = mapped_column(ForeignKey("projet.id", ondelete="CASCADE"), index=True)
    nom: Mapped[str] = mapped_column(String(255))
    entreprise: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    motif: Mapped[str] = mapped_column(Text)
    statut: Mapped[StatutDemande] = mapped_column(
        enum_column(StatutDemande), default=StatutDemande.EN_ATTENTE
    )
    code_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    expire_le: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    date: Mapped[datetime] = created_at()
    date_decision: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    projet: Mapped[Projet] = relationship()


class Consultation(Base):
    __tablename__ = "consultation"

    id: Mapped[int] = mapped_column(primary_key=True)
    projet_id: Mapped[int] = mapped_column(ForeignKey("projet.id", ondelete="CASCADE"), index=True)
    demande_id: Mapped[int | None] = mapped_column(
        ForeignKey("demande_acces.id", ondelete="SET NULL"), index=True
    )
    type_demo: Mapped[str | None] = mapped_column(String(30))
    metier_choisi: Mapped[str | None] = mapped_column(String(60))
    date: Mapped[datetime] = created_at()

    projet: Mapped[Projet] = relationship()
