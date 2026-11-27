"""Textes des e-mails. Ceux destinés au visiteur sont bilingues (FR puis EN)."""

from app.models import DemandeAcces, Message, Projet


def _project_title(projet: Projet) -> str:
    return projet.titre.get("fr") or projet.slug


OBJETS = {
    "projet": "Un projet à réaliser",
    "stage": "Proposition de stage",
    "emploi": "Offre d'emploi",
    "autre": "Autre",
}


def new_message(message: Message) -> tuple[str, str]:
    objet = OBJETS.get(message.objet, "Autre")
    subject = f"Portfolio — {objet} — message de {message.nom}"
    company = f" ({message.entreprise})" if message.entreprise else ""
    body = f"Objet : {objet}\nDe : {message.nom}{company} <{message.email}>\n\n{message.contenu}\n"
    return subject, body


def new_access_request(demande: DemandeAcces, admin_url: str) -> tuple[str, str]:
    subject = f"Portfolio — demande d'accès à {_project_title(demande.projet)}"
    body = (
        f"Projet : {_project_title(demande.projet)}\n"
        f"De : {demande.nom} ({demande.entreprise}) <{demande.email}>\n\n"
        f"Motif :\n{demande.motif}\n\n"
        f"Pour accepter ou refuser : {admin_url}\n"
    )
    return subject, body


def access_granted(demande: DemandeAcces, code: str, project_url: str) -> tuple[str, str]:
    title = _project_title(demande.projet)
    subject = f"Accès au projet {title} / Access to project {title}"
    body = (
        f"Bonjour {demande.nom},\n\n"
        f"Votre demande d'accès au projet « {title} » est acceptée.\n"
        f"Code d'accès (valable 7 jours) : {code}\n"
        f"Page du projet : {project_url}\n\n"
        "---\n\n"
        f"Hello {demande.nom},\n\n"
        f'Your access request for the project "{title}" has been accepted.\n'
        f"Access code (valid for 7 days): {code}\n"
        f"Project page: {project_url}\n"
    )
    return subject, body


def access_refused(demande: DemandeAcces) -> tuple[str, str]:
    title = _project_title(demande.projet)
    subject = f"Votre demande d'accès au projet {title} / Your access request for {title}"
    body = (
        f"Bonjour {demande.nom},\n\n"
        f"Votre demande d'accès au projet « {title} » n'a pas pu être acceptée.\n"
        "Merci de l'intérêt porté à ce travail.\n\n"
        "---\n\n"
        f"Hello {demande.nom},\n\n"
        f'Your access request for the project "{title}" could not be accepted.\n'
        "Thank you for your interest in this work.\n"
    )
    return subject, body
