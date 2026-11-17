from tests.helpers import create_demo, create_project

ZONE = {"x": 10, "y": 20, "largeur": 30, "hauteur": 15}


def step_payload(**overrides) -> dict:
    payload = {
        "image_url": "/uploads/ecran.png",
        "zone": ZONE,
        "legende": {"fr": "Cliquez ici", "en": "Click here"},
    }
    payload.update(overrides)
    return payload


def test_demo_crud(admin):
    projet = create_project(admin)
    demo = create_demo(
        admin,
        projet["id"],
        "bac_a_sable",
        url="https://demo.example.com",
        config={
            "adresse_connexion": "https://demo.example.com/demo/login",
            "roles": [{"cle": "passager", "libelle": {"fr": "Passager", "en": "Passenger"}}],
        },
    )
    assert demo["config"]["roles"][0]["cle"] == "passager"
    assert admin.get(f"/api/admin/projets/{projet['id']}/demos").json()[0]["id"] == demo["id"]

    updated = admin.put(
        f"/api/admin/demos/{demo['id']}",
        json={"type": "bac_a_sable", "url": "https://autre.example.com"},
    )
    assert updated.status_code == 200
    assert updated.json()["url"] == "https://autre.example.com"

    assert admin.delete(f"/api/admin/demos/{demo['id']}").status_code == 204
    assert admin.get(f"/api/admin/projets/{projet['id']}/demos").json() == []


def test_demo_errors(admin):
    projet = create_project(admin)
    url = f"/api/admin/projets/{projet['id']}/demos"
    assert admin.post(url, json={"type": "hologramme"}).status_code == 422
    assert admin.post(url, json={"type": "video", "url": "ftp://x"}).status_code == 422
    bad_role = {"type": "bac_a_sable", "config": {"roles": [{"cle": "a b", "libelle": {}}]}}
    assert admin.post(url, json=bad_role).status_code == 422
    assert admin.post("/api/admin/projets/999/demos", json={"type": "video"}).status_code == 404
    assert admin.get("/api/admin/projets/999/demos").status_code == 404
    assert admin.put("/api/admin/demos/999", json={"type": "video"}).status_code == 404
    assert admin.delete("/api/admin/demos/999").status_code == 404


def test_only_one_main_demo_per_project(admin):
    projet = create_project(admin)
    first = create_demo(admin, projet["id"], "video", est_principale=True)
    second = create_demo(admin, projet["id"], "notebook", est_principale=True)
    demos = {d["id"]: d for d in admin.get(f"/api/admin/projets/{projet['id']}/demos").json()}
    assert demos[first["id"]]["est_principale"] is False
    assert demos[second["id"]]["est_principale"] is True


def test_tour_steps_crud_and_reorder(admin):
    projet = create_project(admin)
    tour = create_demo(admin, projet["id"], "visite", config={"cadre": "telephone"})
    url = f"/api/admin/demos/{tour['id']}/etapes"

    steps = [admin.post(url, json=step_payload()).json() for _ in range(3)]
    assert [s["ordre"] for s in steps] == [0, 1, 2]
    assert steps[0]["zone"] == {"x": 10.0, "y": 20.0, "largeur": 30.0, "hauteur": 15.0}

    updated = admin.put(
        f"/api/admin/etapes/{steps[0]['id']}",
        json=step_payload(zone=None, legende={"fr": "Fin", "en": "End"}),
    )
    assert updated.status_code == 200
    assert updated.json()["zone"] is None
    assert updated.json()["legende"]["fr"] == "Fin"

    new_order = [steps[2]["id"], steps[0]["id"], steps[1]["id"]]
    assert admin.put(f"{url}/ordre", json={"ids": new_order}).status_code == 204
    assert [s["id"] for s in admin.get(url).json()] == new_order
    assert admin.put(f"{url}/ordre", json={"ids": new_order[:1]}).status_code == 422

    assert admin.delete(f"/api/admin/etapes/{steps[1]['id']}").status_code == 204
    assert len(admin.get(url).json()) == 2
    # Les étapes sont livrées avec la démo.
    demos = admin.get(f"/api/admin/projets/{projet['id']}/demos").json()
    assert len(demos[0]["etapes"]) == 2
    assert demos[0]["config"]["cadre"] == "telephone"


def test_tour_step_errors(admin):
    projet = create_project(admin)
    tour = create_demo(admin, projet["id"], "visite")
    video = create_demo(admin, projet["id"], "video")
    url = f"/api/admin/demos/{tour['id']}/etapes"

    out_of_image = {"x": 80, "y": 0, "largeur": 30, "hauteur": 10}
    assert admin.post(url, json=step_payload(zone=out_of_image)).status_code == 422
    assert admin.post(url, json=step_payload(zone={**ZONE, "x": -1})).status_code == 422
    assert admin.post(url, json=step_payload(image_url="")).status_code == 422
    assert admin.post(url, json=step_payload(cadre="tv")).status_code == 201  # champ ignoré

    response = admin.post(f"/api/admin/demos/{video['id']}/etapes", json=step_payload())
    assert response.status_code == 409
    assert response.json() == {"detail": "demo_sans_etapes"}
    assert admin.post("/api/admin/demos/999/etapes", json=step_payload()).status_code == 404
    assert admin.put("/api/admin/etapes/999", json=step_payload()).status_code == 404
    assert admin.delete("/api/admin/etapes/999").status_code == 404
    # Une visite qui a des étapes ne peut pas changer de type.
    change = admin.put(f"/api/admin/demos/{tour['id']}", json={"type": "video"})
    assert change.status_code == 409
    assert (
        admin.put(
            f"/api/admin/demos/{tour['id']}", json={"type": "visite", "config": {"cadre": "tv"}}
        ).status_code
        == 422
    )
