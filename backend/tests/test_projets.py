from tests.helpers import create_project, create_technology, project_payload, set_status


def test_create_project_as_draft(admin):
    projet = create_project(admin, "telcom-exemple")
    assert projet["statut_publication"] == "brouillon"
    assert projet["titre"] == {"fr": "Projet telcom-exemple", "en": "Project telcom-exemple"}
    assert projet["contenu"]["contexte"]["en"] == "Context"
    assert projet["date_publication"] is None


def test_create_project_with_metiers_and_technologies(admin):
    spark = create_technology(admin)
    metier = admin.get("/api/admin/metiers").json()[1]
    projet = create_project(
        admin,
        metiers=[{"metier_id": metier["id"], "pertinence": 3}],
        technologie_ids=[spark["id"]],
    )
    assert projet["metiers"] == [{"metier_id": metier["id"], "pertinence": 3}]
    assert projet["technologie_ids"] == [spark["id"]]
    assert admin.get("/api/admin/technologies").json()[0]["nb_projets"] == 1


def test_create_project_rejects_invalid_data(admin):
    for payload in (
        project_payload("Slug Invalide"),
        project_payload(titre={"fr": "", "en": "Only english"}),
        project_payload(categorie="inconnue"),
        project_payload(contenu={"liens": {"github": "javascript:alert(1)"}}),
    ):
        assert admin.post("/api/admin/projets", json=payload).status_code == 422


def test_create_project_rejects_duplicate_slug_and_unknown_references(admin):
    create_project(admin, "exemple")
    response = admin.post("/api/admin/projets", json=project_payload("exemple"))
    assert response.status_code == 409
    assert response.json() == {"detail": "slug_deja_utilise"}
    response = admin.post("/api/admin/projets", json=project_payload("autre", technologie_ids=[99]))
    assert response.status_code == 422


def test_list_get_and_delete_project(admin):
    first = create_project(admin, "premier")
    create_project(admin, "second")
    assert [p["slug"] for p in admin.get("/api/admin/projets").json()] == ["premier", "second"]
    assert admin.get(f"/api/admin/projets/{first['id']}").json()["slug"] == "premier"
    assert admin.delete(f"/api/admin/projets/{first['id']}").status_code == 204
    assert admin.get(f"/api/admin/projets/{first['id']}").status_code == 404
    assert admin.delete(f"/api/admin/projets/{first['id']}").status_code == 404


def test_reorder_projects(admin):
    ids = [create_project(admin, slug)["id"] for slug in ("a", "b", "c")]
    new_order = [ids[2], ids[0], ids[1]]
    assert admin.put("/api/admin/projets/ordre", json={"ids": new_order}).status_code == 204
    assert [p["id"] for p in admin.get("/api/admin/projets").json()] == new_order
    assert admin.put("/api/admin/projets/ordre", json={"ids": ids[:2]}).status_code == 422


def test_publish_archive_and_back_to_draft(admin):
    projet = create_project(admin)
    published = set_status(admin, projet["id"], "publie")
    assert published["statut_publication"] == "publie"
    assert published["date_publication"] is not None
    assert set_status(admin, projet["id"], "archive")["statut_publication"] == "archive"
    assert set_status(admin, projet["id"], "brouillon")["statut_publication"] == "brouillon"
    response = admin.post(f"/api/admin/projets/{projet['id']}/statut", json={"statut": "x"})
    assert response.status_code == 422
    assert admin.post("/api/admin/projets/999/statut", json={"statut": "publie"}).status_code == 404


def test_update_keeps_history_and_restore_brings_back_a_version(admin):
    projet = create_project(admin, est_phare=False)
    url = f"/api/admin/projets/{projet['id']}"
    assert admin.get(f"{url}/versions").json() == []

    updated = admin.put(
        url, json=project_payload(titre={"fr": "Nouveau titre", "en": ""}, est_phare=True)
    )
    assert updated.status_code == 200
    assert updated.json()["titre"]["fr"] == "Nouveau titre"
    assert updated.json()["est_phare"] is True

    versions = admin.get(f"{url}/versions").json()
    assert len(versions) == 1
    assert versions[0]["contenu"]["titre"]["fr"] == "Projet exemple"

    restored = admin.post(f"{url}/versions/{versions[0]['id']}/restaurer")
    assert restored.status_code == 200
    assert restored.json()["titre"]["fr"] == "Projet exemple"
    assert restored.json()["est_phare"] is False
    # La restauration garde elle aussi une trace de l'état remplacé.
    assert len(admin.get(f"{url}/versions").json()) == 2


def test_restore_ignores_deleted_technology_and_checks_ownership(admin):
    spark = create_technology(admin)
    projet = create_project(admin, technologie_ids=[spark["id"]])
    other = create_project(admin, "autre")
    url = f"/api/admin/projets/{projet['id']}"
    admin.put(url, json=project_payload())
    version_id = admin.get(f"{url}/versions").json()[0]["id"]
    admin.delete(f"/api/admin/technologies/{spark['id']}")

    wrong_owner = f"/api/admin/projets/{other['id']}/versions/{version_id}/restaurer"
    assert admin.post(wrong_owner).status_code == 404
    assert admin.post(f"{url}/versions/999/restaurer").status_code == 404
    restored = admin.post(f"{url}/versions/{version_id}/restaurer")
    assert restored.status_code == 200
    assert restored.json()["technologie_ids"] == []


def test_update_rejects_slug_of_another_project(admin):
    create_project(admin, "pris")
    projet = create_project(admin, "libre")
    response = admin.put(f"/api/admin/projets/{projet['id']}", json=project_payload("pris"))
    assert response.status_code == 409
    assert admin.put("/api/admin/projets/999", json=project_payload()).status_code == 404


def test_preview_shows_a_draft_in_public_format(admin, client):
    projet = create_project(admin, acces_code="confidentiel")
    preview = admin.get(f"/api/admin/projets/{projet['id']}/apercu")
    assert preview.status_code == 200
    body = preview.json()
    assert body["protege"] is False
    assert body["contenu"]["contexte"]["fr"] == "Contexte"
    # Le brouillon reste invisible côté public.
    assert client.get("/api/public/projets/exemple").status_code == 404
    assert admin.get("/api/admin/projets/999/apercu").status_code == 404
