import jwt
import pytest
from sqlalchemy import select

from app.main import app
from app.models import Admin
from app.security import COOKIE_NAME
from tests.conftest import ADMIN_CREDENTIALS


def test_login_sets_httponly_cookie_and_records_connection(client, db):
    response = client.post("/api/auth/connexion", json=ADMIN_CREDENTIALS)
    assert response.status_code == 200
    assert response.json()["email"] == "admin@example.com"
    cookie = response.headers["set-cookie"]
    assert cookie.startswith(f"{COOKIE_NAME}=")
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie
    assert db.scalars(select(Admin)).one().derniere_connexion is not None


def test_login_email_is_case_insensitive(client):
    credentials = {**ADMIN_CREDENTIALS, "email": "Admin@Example.com"}
    assert client.post("/api/auth/connexion", json=credentials).status_code == 200


@pytest.mark.parametrize(
    "credentials",
    [
        {"email": "admin@example.com", "mot_de_passe": "mauvais"},
        {"email": "inconnu@example.com", "mot_de_passe": "mot-de-passe-de-test"},
    ],
)
def test_login_rejects_bad_credentials(client, credentials):
    response = client.post("/api/auth/connexion", json=credentials)
    assert response.status_code == 401
    assert response.json() == {"detail": "identifiants_invalides"}
    assert "set-cookie" not in response.headers


def test_login_validates_payload(client):
    assert client.post("/api/auth/connexion", json={"email": "pas-un-email"}).status_code == 422


def test_login_is_limited_to_5_attempts_per_minute(client):
    bad = {"email": "admin@example.com", "mot_de_passe": "mauvais"}
    statuses = [client.post("/api/auth/connexion", json=bad).status_code for _ in range(6)]
    assert statuses == [401] * 5 + [429]
    # Même le bon mot de passe est refusé tant que la limite est atteinte.
    assert client.post("/api/auth/connexion", json=ADMIN_CREDENTIALS).status_code == 429


def test_me_requires_session(client):
    assert client.get("/api/auth/moi").status_code == 401


def test_me_returns_admin(admin):
    response = admin.get("/api/auth/moi")
    assert response.status_code == 200
    assert response.json()["email"] == "admin@example.com"


def test_logout_clears_session(admin):
    assert admin.post("/api/auth/deconnexion").status_code == 204
    assert admin.get("/api/auth/moi").status_code == 401


def test_forged_or_expired_token_is_rejected(client):
    client.cookies.set(COOKIE_NAME, jwt.encode({"sub": "1"}, "autre-cle" * 5, "HS256"))
    assert client.get("/api/auth/moi").status_code == 401
    client.cookies.set(COOKIE_NAME, "pas-un-jeton")
    assert client.get("/api/auth/moi").status_code == 401


def test_every_admin_route_requires_session(client):
    admin_routes = [
        (method, route["path"])
        for route in _routes()
        for method in route["methods"]
        if route["path"].startswith("/api/admin")
    ]
    assert len(admin_routes) > 40
    for method, path in admin_routes:
        response = client.request(method, path.replace("{", "").replace("}", ""))
        assert response.status_code == 401, f"{method} {path}"


def _routes() -> list[dict]:
    schema = app.openapi()
    return [
        {"path": path, "methods": [method.upper() for method in operations]}
        for path, operations in schema["paths"].items()
    ]
