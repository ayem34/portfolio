"""Fabriques de données pour les tests (via l'API, comme le ferait l'admin)."""

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


def project_payload(slug: str = "exemple", **overrides) -> dict:
    payload = {
        "slug": slug,
        "titre": {"fr": f"Projet {slug}", "en": f"Project {slug}"},
        "resume": {"fr": "Résumé", "en": "Summary"},
        "contenu": {"contexte": {"fr": "Contexte", "en": "Context"}},
    }
    payload.update(overrides)
    return payload


def create_project(admin, slug: str = "exemple", *, published: bool = False, **overrides) -> dict:
    response = admin.post("/api/admin/projets", json=project_payload(slug, **overrides))
    assert response.status_code == 201, response.text
    projet = response.json()
    if published:
        projet = set_status(admin, projet["id"], "publie")
    return projet


def set_status(admin, projet_id: int, statut: str) -> dict:
    response = admin.post(f"/api/admin/projets/{projet_id}/statut", json={"statut": statut})
    assert response.status_code == 200, response.text
    return response.json()


def create_technology(admin, nom: str = "Spark", **overrides) -> dict:
    payload = {"nom": nom, "domaine": {"fr": "Big Data", "en": "Big Data"}, "niveau": "pratique"}
    payload.update(overrides)
    response = admin.post("/api/admin/technologies", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def create_demo(admin, projet_id: int, type_demo: str = "visite", **overrides) -> dict:
    payload = {"type": type_demo, **overrides}
    response = admin.post(f"/api/admin/projets/{projet_id}/demos", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def upload(admin, name: str = "capture.png", content: bytes = PNG, projet_id: int | None = None):
    data = {"projet_id": str(projet_id)} if projet_id is not None else {}
    return admin.post("/api/admin/medias", files={"fichier": (name, content)}, data=data)


def request_access(client, slug: str, **overrides):
    payload = {
        "nom": "Awa Koné",
        "entreprise": "Entreprise Exemple",
        "email": "awa@example.com",
        "motif": "Je souhaite consulter l'étude de cas.",
    }
    payload.update(overrides)
    return client.post(f"/api/public/projets/{slug}/demandes-acces", json=payload)
