from pathlib import Path

import httpx
import pytest

from app.config import get_settings
from app.services import uploads
from app.services.storage import SupabaseStorage
from tests.helpers import PNG, create_demo, create_project, upload


def stored_file(url: str) -> Path:
    return Path(get_settings().uploads_dir) / Path(url).name


def test_upload_regenerates_name_and_serves_file(admin):
    response = upload(admin, "Capture d'écran.PNG")
    assert response.status_code == 201
    media = response.json()
    assert media["type"] == "image"
    assert media["nom"] == "Capture d'écran.PNG"
    assert media["taille"] == len(PNG)
    assert media["url"].startswith("/uploads/") and media["url"].endswith(".png")
    assert "Capture" not in media["url"]
    assert stored_file(media["url"]).read_bytes() == PNG
    served = admin.get(media["url"])
    assert served.status_code == 200
    assert served.headers["x-content-type-options"] == "nosniff"


@pytest.mark.parametrize(
    ("name", "content", "expected_type"),
    [
        ("cv.pdf", b"%PDF-1.7 ...", "pdf"),
        ("demo.mp4", b"\x00\x00\x00\x18ftypmp42", "video"),
        ("analyse.html", b"<!DOCTYPE html><html></html>", "notebook"),
        ("sous-titres.vtt", b"WEBVTT\n\n00:00.000 --> 00:02.000\nBonjour", "sous_titres"),
        ("photo.jpeg", b"\xff\xd8\xff\xe0 jpeg", "image"),
    ],
)
def test_upload_accepts_each_allowed_type(admin, name, content, expected_type):
    response = upload(admin, name, content)
    assert response.status_code == 201
    assert response.json()["type"] == expected_type


@pytest.mark.parametrize(
    ("name", "content", "status", "detail"),
    [
        ("virus.exe", b"MZ", 415, "type_de_fichier_refuse"),
        ("image.svg", b"<svg onload='x'/>", 415, "type_de_fichier_refuse"),
        ("sans-extension", PNG, 415, "type_de_fichier_refuse"),
        ("faux.png", b"<html>pas une image</html>", 415, "contenu_de_fichier_invalide"),
        ("vide.pdf", b"", 415, "contenu_de_fichier_invalide"),
        ("../../etc/passwd.png", b"texte", 415, "contenu_de_fichier_invalide"),
    ],
)
def test_upload_rejects_unsafe_files(admin, name, content, status, detail):
    response = upload(admin, name, content)
    assert response.status_code == status
    assert response.json() == {"detail": detail}


def test_upload_rejects_oversized_file(admin, monkeypatch):
    rule = uploads.RULES[".png"]
    small_rule = uploads.FileRule(rule.media_type, rule.content_type, 20, rule.signatures)
    monkeypatch.setitem(uploads.RULES, ".png", small_rule)
    response = upload(admin)
    assert response.status_code == 413
    assert response.json() == {"detail": "fichier_trop_volumineux"}


def test_upload_never_writes_outside_uploads_dir(admin):
    media = upload(admin, "../../intrus.png").json()
    assert stored_file(media["url"]).parent == Path(get_settings().uploads_dir)
    assert media["nom"] == "intrus.png"


def test_uploaded_notebook_is_sandboxed_when_opened_directly(admin):
    media = upload(admin, "analyse.html", b"<html><script>1</script></html>").json()
    served = admin.get(media["url"])
    assert served.headers["content-security-policy"] == "sandbox allow-scripts"


def test_gallery_order_update_and_library_filters(admin):
    projet = create_project(admin)
    first = upload(admin, "a.png", projet_id=projet["id"]).json()
    second = upload(admin, "b.png", projet_id=projet["id"]).json()
    upload(admin, "cv.pdf", b"%PDF-1.7")
    assert [first["ordre"], second["ordre"]] == [0, 1]

    url = f"/api/admin/medias/ordre?projet_id={projet['id']}"
    assert admin.put(url, json={"ids": [second["id"], first["id"]]}).status_code == 204
    gallery = admin.get(f"/api/admin/medias?projet_id={projet['id']}").json()
    assert [m["nom"] for m in gallery] == ["b.png", "a.png"]
    assert admin.put(url, json={"ids": [first["id"]]}).status_code == 422

    assert len(admin.get("/api/admin/medias").json()) == 3
    assert [m["nom"] for m in admin.get("/api/admin/medias?type=pdf").json()] == ["cv.pdf"]
    assert [m["nom"] for m in admin.get("/api/admin/medias?q=A.PN").json()] == ["a.png"]

    updated = admin.put(
        f"/api/admin/medias/{first['id']}",
        json={"legende": {"fr": "Tableau de bord", "en": "Dashboard"}, "projet_id": None},
    )
    assert updated.status_code == 200
    assert updated.json()["legende"]["en"] == "Dashboard"
    assert updated.json()["projet_id"] is None


def test_media_errors(admin):
    assert upload(admin, projet_id=999).status_code == 404
    assert admin.post("/api/admin/medias").status_code == 422
    assert admin.put("/api/admin/medias/999", json={}).status_code == 404
    assert admin.delete("/api/admin/medias/999").status_code == 404
    media = upload(admin).json()
    attach = admin.put(f"/api/admin/medias/{media['id']}", json={"projet_id": 999})
    assert attach.status_code == 404


def test_delete_removes_file_unless_still_used(admin):
    projet = create_project(admin)
    media = upload(admin).json()
    tour = create_demo(admin, projet["id"], "visite")
    step = admin.post(
        f"/api/admin/demos/{tour['id']}/etapes", json={"image_url": media["url"]}
    ).json()

    blocked = admin.delete(f"/api/admin/medias/{media['id']}")
    assert blocked.status_code == 409
    assert blocked.json() == {"detail": "media_utilise"}
    assert stored_file(media["url"]).exists()

    admin.delete(f"/api/admin/etapes/{step['id']}")
    assert admin.delete(f"/api/admin/medias/{media['id']}").status_code == 204
    assert not stored_file(media["url"]).exists()
    assert admin.get(media["url"]).status_code == 404


def test_supabase_storage_uploads_and_deletes(monkeypatch):
    calls = []

    def fake_request(method):
        def send(url, **kwargs):
            calls.append((method, url, kwargs.get("headers", {})))
            return httpx.Response(200, request=httpx.Request(method, url))

        return send

    monkeypatch.setattr(httpx, "post", fake_request("POST"))
    monkeypatch.setattr(httpx, "delete", fake_request("DELETE"))
    storage = SupabaseStorage("https://abc.supabase.co/", "cle-de-service", "portfolio")

    url = storage.save("fichier.png", PNG, "image/png")
    assert url == "https://abc.supabase.co/storage/v1/object/public/portfolio/fichier.png"
    storage.delete(url)
    storage.delete("https://ailleurs.example.com/fichier.png")  # ignoré : pas dans le bucket

    assert [(method, target) for method, target, _ in calls] == [
        ("POST", "https://abc.supabase.co/storage/v1/object/portfolio/fichier.png"),
        ("DELETE", "https://abc.supabase.co/storage/v1/object/portfolio/fichier.png"),
    ]
    assert calls[0][2]["Authorization"] == "Bearer cle-de-service"
    assert calls[0][2]["Content-Type"] == "image/png"
