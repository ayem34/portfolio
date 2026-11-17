"""Configuration des tests : base PostgreSQL dédiée, créée par les migrations Alembic."""

import os
import tempfile

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://portfolio:portfolio@localhost:5432/portfolio_test"
)
# À fixer avant tout import de l'application (la configuration est lue à l'import).
os.environ.update(
    DATABASE_URL=TEST_DATABASE_URL,
    ENVIRONMENT="test",
    SECRET_KEY="test-secret-key-with-enough-length-0123456789",
    ADMIN_EMAIL="admin@example.com",
    ADMIN_PASSWORD="mot-de-passe-de-test",
    EMAIL_BACKEND="console",
    STORAGE_BACKEND="local",
    DEPLOY_HOOK_URL="",
    SEED_EXAMPLE_CONTENT="false",
    UPLOADS_DIR=tempfile.mkdtemp(prefix="portfolio-test-uploads-"),
    SITE_URL="https://portfolio.test",
)

import pytest  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.engine import make_url  # noqa: E402

from alembic import command  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.rate_limit import limiter  # noqa: E402
from app.scripts.bootstrap import bootstrap  # noqa: E402
from app.services.mailer import console_mailer  # noqa: E402

ADMIN_CREDENTIALS = {"email": "admin@example.com", "mot_de_passe": "mot-de-passe-de-test"}


def alembic_config(database_url: str = TEST_DATABASE_URL) -> Config:
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def _create_database_if_missing() -> None:
    url = make_url(TEST_DATABASE_URL)
    admin_engine = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as connection:
        exists = connection.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": url.database}
        )
        if not exists:
            connection.execute(text(f'CREATE DATABASE "{url.database}"'))
    admin_engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def database():
    _create_database_if_missing()
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public"))
    command.upgrade(alembic_config(), "head")
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_tables(database):
    """Chaque test part d'une base vide, avec le compte admin, les métiers et le profil."""
    tables = ", ".join(f'"{table.name}"' for table in Base.metadata.sorted_tables)
    with engine.begin() as connection:
        connection.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
    with SessionLocal() as session:
        bootstrap(session, get_settings())
    limiter.reset()
    console_mailer.outbox.clear()


@pytest.fixture
def db():
    with SessionLocal() as session:
        yield session


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin(client):
    """Client connecté en tant qu'admin (le cookie de session est conservé)."""
    response = client.post("/api/auth/connexion", json=ADMIN_CREDENTIALS)
    assert response.status_code == 200
    return client


@pytest.fixture
def outbox():
    return console_mailer.outbox
