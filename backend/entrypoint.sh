#!/bin/sh
# Démarrage de l'API : migrations, préparation de la base, puis serveur.
set -e
alembic upgrade head
python -m app.scripts.bootstrap
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" "$@"
