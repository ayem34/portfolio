"""Valeurs autorisées, stockées sans accent (voir docs/questions.md, Q2)."""

from enum import StrEnum


class Categorie(StrEnum):
    PERSONNEL = "personnel"
    ACADEMIQUE = "academique"
    COLLABORATIF = "collaboratif"


class Etat(StrEnum):
    TERMINE = "termine"
    EN_COURS = "en_cours"
    PROTOTYPE = "prototype"


class AccesCode(StrEnum):
    PUBLIC = "public"
    PRIVE = "prive"
    CONFIDENTIEL = "confidentiel"


class StatutPublication(StrEnum):
    BROUILLON = "brouillon"
    PUBLIE = "publie"
    ARCHIVE = "archive"


class Niveau(StrEnum):
    NOTIONS = "notions"
    PRATIQUE = "pratique"
    BONNE_MAITRISE = "bonne_maitrise"


class TypeMedia(StrEnum):
    IMAGE = "image"
    VIDEO = "video"
    PDF = "pdf"
    NOTEBOOK = "notebook"
    SOUS_TITRES = "sous_titres"


class TypeDemo(StrEnum):
    VIDEO = "video"
    VISITE = "visite"
    NOTEBOOK = "notebook"
    PLAYGROUND = "playground"
    BAC_A_SABLE = "bac_a_sable"
    LIEN_EXTERNE = "lien_externe"


class TypeParcours(StrEnum):
    FORMATION = "formation"
    STAGE = "stage"
    CERTIFICATION = "certification"
    HACKATHON = "hackathon"
    CHALLENGE = "challenge"


class StatutDemande(StrEnum):
    EN_ATTENTE = "en_attente"
    ACCEPTEE = "acceptee"
    REFUSEE = "refusee"
    REVOQUEE = "revoquee"


class ObjetMessage(StrEnum):
    """Objet choisi dans le formulaire de contact (recruteur ou client)."""

    PROJET = "projet"
    STAGE = "stage"
    EMPLOI = "emploi"
    AUTRE = "autre"


class FigureMetier(StrEnum):
    """Petite figure animée qui illustre un métier sur le site."""

    GRAPHIQUE = "graphique"
    PIPELINE = "pipeline"
    APPLICATION = "application"


class CouleurMetier(StrEnum):
    """Couleur associée à un métier, reprise partout sur le site (cartes, radar, matrice)."""

    CORAIL = "corail"
    BLEU = "bleu"
    VERT = "vert"
    AMBRE = "ambre"
    VIOLET = "violet"
