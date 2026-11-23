from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.models import Consultation, DemandeAcces, Message
from tests.helpers import (
    create_demo,
    create_project,
    create_technology,
    request_access,
    set_status,
    upload,
)

CONTACT = {"nom": "Awa Koné", "email": "awa@example.com", "contenu": "Bonjour, un stage ?"}


def accept(admin, demande_id: int = 1) -> str:
    response = admin.post(f"/api/admin/demandes-acces/{demande_id}/accepter")
    assert response.status_code == 200, response.text
    return response.json()["code"]


# --- Contenu publié ---


def test_site_lists_only_published_projects(admin):
    spark = create_technology(admin, "Spark")
    create_technology(admin, "SQL")
    metier = admin.get("/api/admin/metiers").json()[1]
    create_project(
        admin,
        "publie",
        published=True,
        technologie_ids=[spark["id"]],
        metiers=[{"metier_id": metier["id"], "pertinence": 3}],
    )
    create_project(admin, "brouillon", technologie_ids=[spark["id"]])
    archived = create_project(admin, "archive", published=True)
    set_status(admin, archived["id"], "archive")

    site = admin.get("/api/public/site").json()
    assert [p["slug"] for p in site["projets"]] == ["publie"]
    assert site["projets"][0]["metiers"] == [
        {"slug": "data-engineer", "nom": metier["nom"], "pertinence": 3}
    ]
    assert [m["slug"] for m in site["metiers"]] == ["data-analyst", "data-engineer", "full-stack"]
    # « Spark → utilisé dans 1 projet » : seuls les projets publiés comptent.
    technologies = {t["nom"]: t["projets"] for t in site["technologies"]}
    assert technologies == {"Spark": ["publie"], "SQL": []}
    assert site["profil"]["nom"] == ""
    assert site["parcours"] == []


def test_site_is_readable_without_session(client):
    assert client.get("/api/public/site").status_code == 200


def test_project_detail_orders_demos_and_computes_badge_level(admin):
    projet = create_project(admin, published=True)
    create_demo(admin, projet["id"], "lien_externe", url="https://example.com")
    create_demo(admin, projet["id"], "video", url="https://example.com/v.mp4")
    create_demo(admin, projet["id"], "notebook", url="/uploads/n.html")
    upload(admin, "capture.png", projet_id=projet["id"])
    upload(admin, "rapport.pdf", b"%PDF-1.7", projet_id=projet["id"])

    detail = admin.get("/api/public/projets/exemple").json()
    assert detail["protege"] is False
    assert [d["type"] for d in detail["demos"]] == ["notebook", "video", "lien_externe"]
    assert detail["types_demo"] == ["notebook", "video", "lien_externe"]
    assert detail["niveau_demo"] == 4
    assert len(detail["galerie"]) == 1  # le PDF n'est pas dans la galerie
    assert detail["image"] == detail["galerie"][0]["url"]
    assert detail["contenu"]["contexte"]["fr"] == "Contexte"


def test_main_demo_comes_first_and_gallery_alone_is_level_1(admin):
    projet = create_project(admin, published=True)
    upload(admin, projet_id=projet["id"])
    assert admin.get("/api/public/projets/exemple").json()["niveau_demo"] == 1
    create_demo(admin, projet["id"], "bac_a_sable")
    create_demo(admin, projet["id"], "visite", est_principale=True)
    detail = admin.get("/api/public/projets/exemple").json()
    assert [d["type"] for d in detail["demos"]] == ["visite", "bac_a_sable"]
    assert detail["niveau_demo"] == 6


def test_project_without_proof_has_level_0(admin):
    create_project(admin, published=True)
    assert admin.get("/api/public/site").json()["projets"][0]["niveau_demo"] == 0


def test_unpublished_or_unknown_project_is_404(admin):
    create_project(admin, "brouillon")
    assert admin.get("/api/public/projets/brouillon").status_code == 404
    assert admin.get("/api/public/projets/inconnu").status_code == 404


# --- Projets confidentiels et accès sur demande ---


def confidential_project(admin) -> dict:
    projet = create_project(admin, "client", published=True, acces_code="confidentiel")
    create_demo(admin, projet["id"], "visite")
    upload(admin, projet_id=projet["id"])
    return projet


def test_confidential_project_only_exposes_its_header(admin):
    confidential_project(admin)
    detail = admin.get("/api/public/projets/client").json()
    assert detail["protege"] is True
    assert detail["titre"]["fr"] == "Projet client"
    assert detail["contenu"] is None
    assert detail["demos"] == []
    assert detail["galerie"] == []
    assert detail["image"] is None
    assert detail["types_demo"] == ["visite"]
    assert admin.get("/api/public/site").json()["projets"][0]["image"] is None


def test_access_request_is_stored_and_notified(admin, db, outbox):
    confidential_project(admin)
    response = request_access(admin, "client")
    assert response.status_code == 201
    demande = db.scalars(select(DemandeAcces)).one()
    assert (demande.nom, demande.statut, demande.code_hash) == ("Awa Koné", "en_attente", None)
    assert outbox[0]["to"] == "admin@example.com"
    assert "Projet client" in outbox[0]["subject"]
    assert "https://portfolio.test/admin/demandes-acces" in outbox[0]["body"]


def test_access_request_errors(admin, db):
    confidential_project(admin)
    create_project(admin, "ouvert", published=True)
    create_project(admin, "brouillon", acces_code="confidentiel")
    assert request_access(admin, "client", email="invalide").status_code == 422
    assert request_access(admin, "client", motif="court").status_code == 422
    assert request_access(admin, "ouvert").status_code == 409
    assert request_access(admin, "brouillon").status_code == 404
    assert request_access(admin, "inconnu").status_code == 404
    # Champ piège rempli : réponse identique, rien n'est enregistré.
    assert request_access(admin, "client", site_web="http://spam").status_code == 201
    assert db.scalars(select(DemandeAcces)).all() == []


def test_access_requests_are_rate_limited(admin):
    confidential_project(admin)
    statuses = [request_access(admin, "client").status_code for _ in range(4)]
    assert statuses == [201, 201, 201, 429]


def test_accepted_request_gives_a_hashed_7_day_code_that_unlocks_the_project(admin, db, outbox):
    confidential_project(admin)
    request_access(admin, "client")
    outbox.clear()
    code = accept(admin)

    demande = db.scalars(select(DemandeAcces)).one()
    assert demande.statut == "acceptee"
    assert code not in (demande.code_hash or "")
    assert len(demande.code_hash) == 64
    remaining = demande.expire_le - datetime.now(UTC)
    assert timedelta(days=6, hours=23) < remaining <= timedelta(days=7)
    assert outbox[0]["to"] == "awa@example.com"
    assert code in outbox[0]["body"]
    assert "https://portfolio.test/projets/client" in outbox[0]["body"]

    # Le code est accepté même saisi en minuscules avec des espaces.
    unlocked = admin.post("/api/public/projets/client/acces", json={"code": f" {code.lower()} "})
    assert unlocked.status_code == 200
    body = unlocked.json()
    assert body["protege"] is False
    assert body["contenu"] is not None
    assert len(body["demos"]) == 1 and len(body["galerie"]) == 1

    consultation = db.scalars(select(Consultation)).one()
    assert consultation.demande_id == demande.id
    journal = admin.get(f"/api/admin/demandes-acces/{demande.id}/consultations").json()
    assert len(journal) == 1
    assert admin.get("/api/admin/demandes-acces").json()[0]["nb_consultations"] == 1


def test_wrong_expired_revoked_or_foreign_code_is_refused(admin, db):
    confidential_project(admin)
    other = create_project(admin, "autre-client", published=True, acces_code="confidentiel")
    request_access(admin, "client")
    code = accept(admin)
    url = "/api/public/projets/client/acces"

    assert admin.post(url, json={"code": "AAAA-BBBB-CCCC"}).status_code == 403
    assert admin.post(url, json={"code": ""}).status_code == 422
    foreign = admin.post(f"/api/public/projets/{other['slug']}/acces", json={"code": code})
    assert foreign.status_code == 403

    demande = db.scalars(select(DemandeAcces)).one()
    demande.expire_le = datetime.now(UTC) - timedelta(minutes=1)
    db.commit()
    expired = admin.post(url, json={"code": code})
    assert expired.status_code == 403
    assert expired.json() == {"detail": "code_invalide"}

    demande.expire_le = datetime.now(UTC) + timedelta(days=1)
    db.commit()
    assert admin.post(url, json={"code": code}).status_code == 200
    assert admin.post("/api/admin/demandes-acces/1/revoquer").status_code == 200
    assert admin.post(url, json={"code": code}).status_code == 403


def test_code_attempts_are_rate_limited(admin):
    confidential_project(admin)
    url = "/api/public/projets/client/acces"
    statuses = [admin.post(url, json={"code": "AAAA-BBBB"}).status_code for _ in range(11)]
    assert statuses == [403] * 10 + [429]


def test_refuse_and_decision_errors(admin, outbox):
    confidential_project(admin)
    request_access(admin, "client")
    outbox.clear()
    refused = admin.post("/api/admin/demandes-acces/1/refuser")
    assert refused.status_code == 200
    assert refused.json()["statut"] == "refusee"
    assert outbox[0]["to"] == "awa@example.com"
    # Une demande déjà traitée ne peut plus être acceptée, refusée ou révoquée.
    for action in ("accepter", "refuser", "revoquer"):
        assert admin.post(f"/api/admin/demandes-acces/1/{action}").status_code == 409
        assert admin.post(f"/api/admin/demandes-acces/999/{action}").status_code == 404
    assert admin.get("/api/admin/demandes-acces/999/consultations").status_code == 404


# --- Contact ---


def test_contact_message_is_stored_and_notified(client, db, outbox):
    response = client.post("/api/public/messages", json=CONTACT)
    assert response.status_code == 201
    message = db.scalars(select(Message)).one()
    assert (message.nom, message.email, message.traite) == ("Awa Koné", "awa@example.com", False)
    assert outbox[0]["to"] == "admin@example.com"
    assert "Bonjour, un stage ?" in outbox[0]["body"]


def test_contact_honeypot_and_validation(client, db, outbox):
    trapped = client.post("/api/public/messages", json={**CONTACT, "site_web": "http://spam"})
    assert trapped.status_code == 201
    assert db.scalars(select(Message)).all() == []
    assert outbox == []
    assert client.post("/api/public/messages", json={**CONTACT, "email": "x"}).status_code == 422
    assert client.post("/api/public/messages", json={**CONTACT, "contenu": "Hi"}).status_code == 422


def test_contact_is_rate_limited(client):
    statuses = [client.post("/api/public/messages", json=CONTACT).status_code for _ in range(4)]
    assert statuses == [201, 201, 201, 429]


def test_contact_survives_a_failing_mail_server(client, db, monkeypatch, outbox):
    def broken_send(*args):
        raise ConnectionError("serveur d'e-mail injoignable")

    monkeypatch.setattr("app.services.mailer.ConsoleMailer.send", broken_send)
    assert client.post("/api/public/messages", json=CONTACT).status_code == 201
    assert len(db.scalars(select(Message)).all()) == 1


# --- Consultations ---


def test_consultations_record_views_demo_launches_and_metier(admin, db):
    create_project(admin, published=True)
    create_project(admin, "brouillon")
    url = "/api/public/consultations"
    assert (
        admin.post(url, json={"slug": "exemple", "metier_choisi": "data-analyst"}).status_code
        == 204
    )
    launch = {"slug": "exemple", "type_demo": "visite", "metier_choisi": "metier-invente"}
    assert admin.post(url, json=launch).status_code == 204
    rows = db.scalars(select(Consultation).order_by(Consultation.id)).all()
    assert [(r.type_demo, r.metier_choisi) for r in rows] == [
        (None, "data-analyst"),
        ("visite", None),
    ]

    assert admin.post(url, json={"slug": "brouillon"}).status_code == 404
    assert admin.post(url, json={"slug": "exemple", "type_demo": "hologramme"}).status_code == 422
