from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import inspect, select

from app.config import get_settings
from app.database import Base, engine
from app.models import Admin, Metier, Profil
from app.scripts.bootstrap import bootstrap
from app.security import verify_password

EXPECTED_TABLES = {
    "admin",
    "profil",
    "projet",
    "version_projet",
    "metier",
    "projet_metier",
    "technologie",
    "projet_technologie",
    "media",
    "demo",
    "etape_visite",
    "parcours",
    "message",
    "demande_acces",
    "consultation",
}


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_migrations_create_the_15_tables():
    tables = set(inspect(engine).get_table_names()) - {"alembic_version"}
    assert tables == EXPECTED_TABLES


def test_migrations_match_models():
    """Aucun écart entre les modèles et la base créée par les migrations."""
    with engine.connect() as connection:
        differences = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    assert differences == []


def test_bootstrap_creates_admin_metiers_and_profil(db):
    admin = db.scalars(select(Admin)).one()
    assert admin.email == "admin@example.com"
    assert admin.mot_de_passe_hash != "mot-de-passe-de-test"
    assert verify_password("mot-de-passe-de-test", admin.mot_de_passe_hash)
    assert [m.slug for m in db.scalars(select(Metier).order_by(Metier.ordre))] == [
        "data-analyst",
        "data-engineer",
        "full-stack",
    ]
    assert db.get(Profil, 1) is not None


def test_bootstrap_is_idempotent(db):
    bootstrap(db, get_settings())
    bootstrap(db, get_settings())
    assert len(db.scalars(select(Admin)).all()) == 1
    assert len(db.scalars(select(Metier)).all()) == 3
