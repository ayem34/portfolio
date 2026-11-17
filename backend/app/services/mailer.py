"""Envoi d'e-mails : SMTP (Mailpit en local), Resend (en ligne) ou console (EMAIL_BACKEND)."""

import logging
import smtplib
from email.message import EmailMessage
from typing import Protocol

import httpx

from app.config import Settings, get_settings

logger = logging.getLogger("mailer")


class Mailer(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


class ConsoleMailer:
    """Affiche l'e-mail dans les journaux et le garde en mémoire (utile aux tests)."""

    def __init__(self) -> None:
        self.outbox: list[dict[str, str]] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.outbox.append({"to": to, "subject": subject, "body": body})
        logger.info("E-mail pour %s — %s\n%s", to, subject, body)


class SmtpMailer:
    def __init__(self, host: str, port: int, sender: str) -> None:
        self.host, self.port, self.sender = host, port, sender

    def send(self, to: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"], message["To"], message["Subject"] = self.sender, to, subject
        message.set_content(body)
        with smtplib.SMTP(self.host, self.port, timeout=10) as smtp:
            smtp.send_message(message)


class ResendMailer:
    def __init__(self, api_key: str, sender: str) -> None:
        self.api_key, self.sender = api_key, sender

    def send(self, to: str, subject: str, body: str) -> None:
        httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"from": self.sender, "to": [to], "subject": subject, "text": body},
            timeout=10,
        ).raise_for_status()


console_mailer = ConsoleMailer()


def build_mailer(settings: Settings) -> Mailer:
    if settings.email_backend == "smtp":
        return SmtpMailer(settings.smtp_host, settings.smtp_port, settings.email_from)
    if settings.email_backend == "resend":
        return ResendMailer(settings.resend_api_key, settings.email_from)
    return console_mailer


def get_mailer() -> Mailer:
    return build_mailer(get_settings())


def send_safely(mailer: Mailer, to: str, message: tuple[str, str]) -> None:
    """Un e-mail qui échoue ne doit jamais faire échouer la demande du visiteur."""
    if not to:
        return
    subject, body = message
    try:
        mailer.send(to, subject, body)
    except Exception:  # noqa: BLE001
        logger.exception("Échec de l'envoi de l'e-mail à %s", to)
