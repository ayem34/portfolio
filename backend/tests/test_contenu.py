from tests.helpers import create_technology


def test_profile_read_and_update(admin):
    assert admin.get("/api/admin/profil").json()["nom"] == ""
    payload = {
        "nom": "Exemple",
        "titre": {"fr": "Étudiante", "en": "Student"},
        "presentation": {"accroche": {"fr": "Bonjour", "en": "Hello"}},
        "email": "contact@example.com",
        "liens": {"github": "https://github.com/exemple", "linkedin": ""},
        "cv_url": "/uploads/cv.pdf",
    }
    response = admin.put("/api/admin/profil", json=payload)
    assert response.status_code == 200
    body = admin.get("/api/admin/profil").json()
    assert body["titre"]["en"] == "Student"
    assert body["presentation"]["accroche"]["fr"] == "Bonjour"
    assert body["presentation"]["methode"] == {"fr": "", "en": ""}
    assert body["cv_url"] == "/uploads/cv.pdf"


def test_profile_rejects_invalid_values(admin):
    assert admin.put("/api/admin/profil", json={"email": "pas-un-email"}).status_code == 422
    bad_link = {"liens": {"github": "javascript:alert(1)"}}
    assert admin.put("/api/admin/profil", json=bad_link).status_code == 422


def test_metiers_are_listed_in_order(admin):
    slugs = [metier["slug"] for metier in admin.get("/api/admin/metiers").json()]
    assert slugs == ["data-analyst", "data-engineer", "full-stack"]


def test_technology_crud_and_reorder(admin):
    spark = create_technology(admin, "Spark")
    sql = create_technology(admin, "SQL", niveau="bonne_maitrise")
    assert [t["nom"] for t in admin.get("/api/admin/technologies").json()] == ["Spark", "SQL"]

    updated = admin.put(
        f"/api/admin/technologies/{spark['id']}",
        json={"nom": "Apache Spark", "domaine": {"fr": "Big Data", "en": "Big Data"}},
    )
    assert updated.json()["nom"] == "Apache Spark"
    assert updated.json()["niveau"] == "notions"

    order = {"ids": [sql["id"], spark["id"]]}
    assert admin.put("/api/admin/technologies/ordre", json=order).status_code == 204
    assert [t["nom"] for t in admin.get("/api/admin/technologies").json()] == [
        "SQL",
        "Apache Spark",
    ]
    assert admin.delete(f"/api/admin/technologies/{sql['id']}").status_code == 204
    assert len(admin.get("/api/admin/technologies").json()) == 1


def test_technology_errors(admin):
    spark = create_technology(admin, "Spark")
    payload = {"nom": "Spark", "domaine": {"fr": "Big Data", "en": ""}}
    assert admin.post("/api/admin/technologies", json=payload).status_code == 409
    assert admin.post("/api/admin/technologies", json={"nom": ""}).status_code == 422
    bad_level = {**payload, "nom": "Hadoop", "niveau": "expert"}
    assert admin.post("/api/admin/technologies", json=bad_level).status_code == 422
    assert admin.put("/api/admin/technologies/999", json=payload).status_code == 404
    assert admin.delete("/api/admin/technologies/999").status_code == 404
    assert admin.put("/api/admin/technologies/ordre", json={"ids": []}).status_code == 422
    assert admin.put(f"/api/admin/technologies/{spark['id']}", json=payload).status_code == 200


def timeline_payload(**overrides) -> dict:
    payload = {
        "type": "formation",
        "titre": {"fr": "Formation d'exemple", "en": "Example degree"},
        "etablissement": "École Exemple",
        "date_debut": "2024-09-01",
        "date_fin": None,
        "description": {"fr": "Description", "en": "Description"},
        "justificatif_url": None,
    }
    payload.update(overrides)
    return payload


def test_timeline_crud_sorted_by_date(admin):
    old = admin.post("/api/admin/parcours", json=timeline_payload(date_debut="2021-09-01"))
    assert old.status_code == 201
    recent = admin.post(
        "/api/admin/parcours",
        json=timeline_payload(type="certification", justificatif_url="/uploads/attestation.pdf"),
    ).json()
    entries = admin.get("/api/admin/parcours").json()
    assert [e["id"] for e in entries] == [recent["id"], old.json()["id"]]
    assert entries[0]["justificatif_url"] == "/uploads/attestation.pdf"

    updated = admin.put(
        f"/api/admin/parcours/{recent['id']}", json=timeline_payload(type="hackathon")
    )
    assert updated.json()["type"] == "hackathon"
    assert admin.delete(f"/api/admin/parcours/{recent['id']}").status_code == 204
    assert len(admin.get("/api/admin/parcours").json()) == 1


def test_timeline_errors(admin):
    inverted = timeline_payload(date_debut="2024-01-01", date_fin="2023-01-01")
    assert admin.post("/api/admin/parcours", json=inverted).status_code == 422
    assert admin.post("/api/admin/parcours", json=timeline_payload(type="autre")).status_code == 422
    assert admin.put("/api/admin/parcours/999", json=timeline_payload()).status_code == 404
    assert admin.delete("/api/admin/parcours/999").status_code == 404
