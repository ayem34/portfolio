import httpx

from app.config import get_settings
from app.rate_limit import client_address
from app.services import mailer as mailer_module
from app.services.mailer import ResendMailer, SmtpMailer, build_mailer
from tests.helpers import create_project, request_access

CONTACT = {"nom": "Awa Koné", "email": "awa@example.com", "contenu": "Bonjour, un stage ?"}


def test_messages_list_mark_and_delete(admin):
    admin.post("/api/public/messages", json=CONTACT)
    admin.post("/api/public/messages", json={**CONTACT, "nom": "Koffi"})
    messages = admin.get("/api/admin/messages").json()
    assert [m["nom"] for m in messages] == ["Koffi", "Awa Koné"]

    message_id = messages[0]["id"]
    updated = admin.put(f"/api/admin/messages/{message_id}", json={"traite": True})
    assert updated.json()["traite"] is True
    assert admin.delete(f"/api/admin/messages/{message_id}").status_code == 204
    assert len(admin.get("/api/admin/messages").json()) == 1

    assert admin.put("/api/admin/messages/999", json={"traite": True}).status_code == 404
    assert admin.put(f"/api/admin/messages/{messages[1]['id']}", json={}).status_code == 422
    assert admin.delete("/api/admin/messages/999").status_code == 404


def test_statistics(admin):
    create_project(admin, "vu", published=True)
    create_project(admin, "client", published=True, acces_code="confidentiel")
    url = "/api/public/consultations"
    admin.post(url, json={"slug": "vu", "metier_choisi": "data-analyst"})
    admin.post(url, json={"slug": "vu", "metier_choisi": "data-analyst"})
    admin.post(url, json={"slug": "vu", "type_demo": "visite", "metier_choisi": "full-stack"})
    admin.post(url, json={"slug": "client"})
    admin.post("/api/public/messages", json=CONTACT)
    request_access(admin, "client")

    stats = admin.get("/api/admin/statistiques").json()
    assert stats["jours"] == 30
    assert (stats["total_vues"], stats["total_demos_lancees"]) == (3, 1)
    assert [(p["slug"], p["vues"], p["demos_lancees"]) for p in stats["vues_par_projet"]] == [
        ("vu", 2, 1),
        ("client", 1, 0),
    ]
    assert stats["demos_lancees"] == [{"cle": "visite", "total": 1}]
    assert stats["metiers_choisis"] == [
        {"cle": "data-analyst", "total": 2},
        {"cle": "full-stack", "total": 1},
    ]
    assert (stats["messages_non_traites"], stats["demandes_en_attente"]) == (1, 1)
    assert stats["derniers_messages"][0]["nom"] == "Awa Koné"
    assert stats["dernieres_demandes"][0]["projet_slug"] == "client"
    assert admin.get("/api/admin/statistiques?jours=0").status_code == 422


def test_statistics_on_empty_site(admin):
    stats = admin.get("/api/admin/statistiques?jours=7").json()
    assert stats["total_vues"] == 0
    assert stats["vues_par_projet"] == []


class _Calls(list):
    status = 201


def test_publication_triggers_the_deploy_hook(admin, monkeypatch):
    monkeypatch.setattr(get_settings(), "deploy_hook_url", "https://hook.example.com/deploy")
    calls = _Calls()

    def fake_post(url, **kwargs):
        calls.append(url)
        return httpx.Response(calls.status, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    assert admin.get("/api/admin/publication").json() == {
        "configuree": True,
        "site_url": "https://portfolio.test",
    }
    response = admin.post("/api/admin/publication")
    assert response.status_code == 200
    assert response.json() == {"declenchee": True}
    assert calls == ["https://hook.example.com/deploy"]

    calls.status = 500
    failed = admin.post("/api/admin/publication")
    assert failed.status_code == 502
    assert failed.json() == {"detail": "deploy_hook_en_echec"}


def test_publication_without_deploy_hook(admin):
    assert admin.get("/api/admin/publication").json()["configuree"] is False
    response = admin.post("/api/admin/publication")
    assert response.status_code == 409
    assert response.json() == {"detail": "deploy_hook_non_configure"}


def test_mailer_backend_is_chosen_by_environment(monkeypatch):
    settings = get_settings().model_copy(update={"email_backend": "smtp", "smtp_host": "mailpit"})
    assert isinstance(build_mailer(settings), SmtpMailer)
    settings = settings.model_copy(update={"email_backend": "resend", "resend_api_key": "cle"})
    assert isinstance(build_mailer(settings), ResendMailer)
    settings = settings.model_copy(update={"email_backend": "console"})
    assert build_mailer(settings) is mailer_module.console_mailer


def test_smtp_and_resend_mailers_send(monkeypatch):
    sent = []

    class FakeSmtp:
        def __init__(self, host, port, timeout):
            sent.append(("smtp", host, port))

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def send_message(self, message):
            sent.append((message["To"], message["Subject"], message.get_content().strip()))

    monkeypatch.setattr(mailer_module.smtplib, "SMTP", FakeSmtp)
    SmtpMailer("mailpit", 1025, "Portfolio <p@example.com>").send("a@example.com", "Sujet", "Corps")
    assert sent == [("smtp", "mailpit", 1025), ("a@example.com", "Sujet", "Corps")]

    def fake_post(url, **kwargs):
        sent.append((url, kwargs["json"]["to"], kwargs["headers"]["Authorization"]))
        return httpx.Response(200, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    ResendMailer("cle", "Portfolio <p@example.com>").send("a@example.com", "Sujet", "Corps")
    assert sent[-1] == ("https://api.resend.com/emails", ["a@example.com"], "Bearer cle")


class _Request:
    def __init__(self, forwarded: str | None):
        self.headers = {"x-forwarded-for": forwarded} if forwarded else {}
        self.client = type("Client", (), {"host": "10.0.0.1"})()


def test_client_address_only_trusts_configured_proxies(monkeypatch):
    spoofed = _Request("1.2.3.4, 203.0.113.9")
    assert client_address(spoofed) == "10.0.0.1"
    monkeypatch.setattr(get_settings(), "trusted_proxy_count", 1)
    assert client_address(spoofed) == "203.0.113.9"
    assert client_address(_Request(None)) == "10.0.0.1"
