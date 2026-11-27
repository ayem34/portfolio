"""Données ajoutées pour la refonte du design : métiers illustrés, apprentissage, contact."""

from sqlalchemy import select

from app.config import get_settings
from app.models import Message, Metier
from app.scripts.bootstrap import bootstrap
from tests.helpers import create_project, create_technology, set_status

CONTACT = {"nom": "Awa Koné", "email": "awa@example.com", "contenu": "Bonjour, un projet ?"}


def test_metiers_come_with_figure_colour_and_texts(admin):
    metiers = admin.get("/api/admin/metiers").json()
    assert [(m["figure"], m["couleur"]) for m in metiers] == [
        ("graphique", "corail"),
        ("pipeline", "bleu"),
        ("application", "vert"),
    ]
    assert metiers[0]["description"]["fr"].startswith("Nettoyer")
    assert metiers[2]["offre"]["titre"]["fr"] == "Application web sur mesure"


def test_metier_update_keeps_the_slug(admin):
    metier = admin.get("/api/admin/metiers").json()[0]
    payload = {
        "nom": {"fr": "Analyste de données", "en": "Data Analyst"},
        "description": {"fr": "Des chiffres qui décident.", "en": "Numbers that decide."},
        "offre": {"titre": {"fr": "Tableaux de bord", "en": "Dashboards"}},
        "figure": "pipeline",
        "couleur": "ambre",
    }
    response = admin.put(f"/api/admin/metiers/{metier['id']}", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert (body["slug"], body["couleur"], body["figure"]) == ("data-analyst", "ambre", "pipeline")
    assert body["offre"]["texte"] == {"fr": "", "en": ""}

    assert (
        admin.put(
            f"/api/admin/metiers/{metier['id']}", json={**payload, "couleur": "rose"}
        ).status_code
        == 422
    )
    assert (
        admin.put(f"/api/admin/metiers/{metier['id']}", json={"nom": {"fr": ""}}).status_code == 422
    )
    assert admin.put("/api/admin/metiers/999", json=payload).status_code == 404


def test_metier_order_can_change(admin):
    ids = [m["id"] for m in admin.get("/api/admin/metiers").json()]
    assert admin.put("/api/admin/metiers/ordre", json={"ids": ids[::-1]}).status_code == 204
    slugs = [m["slug"] for m in admin.get("/api/admin/metiers").json()]
    assert slugs == ["full-stack", "data-engineer", "data-analyst"]


def test_bootstrap_fills_old_metiers_without_overwriting_edits(db):
    old = db.scalars(select(Metier).where(Metier.slug == "data-engineer")).one()
    old.description, old.figure = {}, "application"
    edited = db.scalars(select(Metier).where(Metier.slug == "full-stack")).one()
    edited.description = {"fr": "Mon texte", "en": ""}
    db.commit()

    bootstrap(db, get_settings())

    db.refresh(old)
    db.refresh(edited)
    assert old.figure == "pipeline" and old.description["fr"].startswith("Collecter")
    assert edited.description["fr"] == "Mon texte"


def test_learning_fields_on_technologies_reach_the_public_site(admin):
    payload = {
        "nom": "Airflow",
        "domaine": {"fr": "Ingénierie des données", "en": "Data engineering"},
        "source": {"fr": "Autoformation", "en": "Self-study"},
        "progression": 2,
    }
    created = admin.post("/api/admin/technologies", json=payload)
    assert created.status_code == 201, created.text
    assert (
        admin.post(
            "/api/admin/technologies", json={**payload, "nom": "X", "progression": 4}
        ).status_code
        == 422
    )

    site = admin.get("/api/public/site").json()
    airflow = next(t for t in site["technologies"] if t["nom"] == "Airflow")
    assert (airflow["source"]["fr"], airflow["progression"], airflow["projets"]) == (
        "Autoformation",
        2,
        [],
    )
    assert site["metiers"][1]["figure"] == "pipeline"
    assert site["metiers"][1]["offre"]["titre"]["fr"] == "Données et automatisation"


def test_project_key_infos_are_saved_and_published(admin):
    sql = create_technology(admin, "SQL")
    projet = create_project(
        admin,
        "edu-biblio",
        technologie_ids=[sql["id"]],
        contenu={
            "infos": {
                "periode": {"fr": "2025-2026", "en": "2025-2026"},
                "equipe": {"fr": "Solo", "en": "Solo"},
            }
        },
    )
    set_status(admin, projet["id"], "publie")
    detail = admin.get("/api/public/projets/edu-biblio").json()
    assert detail["contenu"]["infos"]["periode"]["fr"] == "2025-2026"
    assert detail["contenu"]["infos"]["role"] == {"fr": "", "en": ""}


def test_profile_presentation_has_slogan_availability_and_location(admin):
    presentation = {
        "slogan": {"fr": "Du génie logiciel à la **Data Science.**", "en": ""},
        "disponibilite": {"fr": "à partir de février 2027", "en": "from February 2027"},
        "localisation": {"fr": "Yamoussoukro", "en": "Yamoussoukro"},
    }
    assert admin.put("/api/admin/profil", json={"presentation": presentation}).status_code == 200
    body = admin.get("/api/public/site").json()["profil"]["presentation"]
    assert body["disponibilite"]["en"] == "from February 2027"
    assert body["slogan"]["fr"].endswith("**Data Science.**")


def test_contact_keeps_subject_and_company(client, db, outbox):
    payload = {**CONTACT, "objet": "projet", "entreprise": "Agri CI"}
    assert client.post("/api/public/messages", json=payload).status_code == 201
    message = db.scalars(select(Message)).one()
    assert (message.objet, message.entreprise) == ("projet", "Agri CI")
    assert "Un projet à réaliser" in outbox[0]["subject"]
    assert "Awa Koné (Agri CI)" in outbox[0]["body"]


def test_contact_subject_defaults_to_other_and_is_checked(client, db):
    assert client.post("/api/public/messages", json=CONTACT).status_code == 201
    assert db.scalars(select(Message)).one().objet == "autre"
    assert client.post("/api/public/messages", json={**CONTACT, "objet": "spam"}).status_code == 422


def test_admin_message_list_shows_subject_and_company(admin, client):
    client.post("/api/public/messages", json={**CONTACT, "objet": "stage", "entreprise": "Orange"})
    message = admin.get("/api/admin/messages").json()[0]
    assert (message["objet"], message["entreprise"]) == ("stage", "Orange")
