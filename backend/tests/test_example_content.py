from pathlib import Path

from sqlalchemy import select

from app.config import get_settings
from app.enums import TypeDemo
from app.models import Admin, Media, Parcours, Projet, Technologie
from app.scripts.bootstrap import bootstrap
from app.scripts.example_content import seed_example_content
from app.services.storage import LocalStorage


def storage() -> LocalStorage:
    return LocalStorage(get_settings().uploads_dir)


def test_example_content_is_fictitious_draft_and_covers_every_demo_type(db, admin):
    assert seed_example_content(db, storage()) is True
    db.commit()

    projets = db.scalars(select(Projet).order_by(Projet.ordre)).all()
    assert len(projets) == 3
    for projet in projets:
        assert projet.statut_publication == "brouillon"
        assert projet.titre["fr"].startswith("Exemple — ")
        assert projet.titre["en"].startswith("Example — ")
        assert projet.slug.startswith("exemple-")
    assert {demo.type for projet in projets for demo in projet.demos} == set(TypeDemo)

    # Rien n'est visible publiquement, et aucun contenu sans statut « brouillon » n'est créé.
    assert admin.get("/api/public/site").json()["projets"] == []
    assert db.scalars(select(Technologie)).all() == []
    assert db.scalars(select(Parcours)).all() == []

    # Visite guidée complète : 3 écrans, zones en %, légendes FR/EN, cadre téléphone.
    preview = admin.get(f"/api/admin/projets/{projets[0].id}/apercu").json()
    tour = preview["demos"][0]
    assert (tour["type"], tour["config"]["cadre"], len(tour["etapes"])) == (
        "visite",
        "telephone",
        3,
    )
    assert tour["etapes"][0]["zone"] == {"x": 5.0, "y": 30.0, "largeur": 90.0, "hauteur": 7.5}
    assert tour["etapes"][2]["zone"] is None
    assert all(step["legende"]["fr"] and step["legende"]["en"] for step in tour["etapes"])
    assert preview["niveau_demo"] == 6
    assert len(preview["galerie"]) == 2

    # Les fichiers d'exemple sont réellement importés et servis.
    for media in db.scalars(select(Media)):
        assert media.nom.startswith("exemple-")
        assert (Path(get_settings().uploads_dir) / Path(media.url).name).exists()
    assert admin.get(tour["etapes"][0]["image_url"]).status_code == 200


def test_example_content_is_not_recreated_when_projects_exist(db):
    assert seed_example_content(db, storage()) is True
    db.commit()
    assert seed_example_content(db, storage()) is False
    assert len(db.scalars(select(Projet)).all()) == 3


def test_bootstrap_seeds_examples_only_on_first_start(db):
    settings = get_settings().model_copy(update={"seed_example_content": True})
    # La base de test a déjà son compte admin : ce n'est plus un premier démarrage.
    bootstrap(db, settings)
    assert db.scalars(select(Projet)).all() == []

    db.delete(db.scalars(select(Admin)).one())
    db.commit()
    bootstrap(db, settings)
    assert len(db.scalars(select(Projet)).all()) == 3

    disabled = settings.model_copy(update={"seed_example_content": False})
    for projet in db.scalars(select(Projet)):
        db.delete(projet)
    db.delete(db.scalars(select(Admin)).one())
    db.commit()
    bootstrap(db, disabled)
    assert db.scalars(select(Projet)).all() == []
