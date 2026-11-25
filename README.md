# Portfolio AYEM

Portfolio professionnel d'Ayem : site public (React), panneau d'administration (`/admin`) et API (FastAPI + PostgreSQL).
La conception est dans [`docs/conception.md`](docs/conception.md), les choix techniques dans [`docs/plan-technique.md`](docs/plan-technique.md).

## Lancer en local

Prérequis : Docker (avec Docker Compose). Aucun compte externe n'est nécessaire.

```bash
docker compose up
```

Au premier lancement, les migrations créent les tables et un script crée le compte administrateur
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`, par défaut `admin@example.com` / `changez-moi`).
Pour changer ces valeurs, copier `.env.example` en `.env` avant le premier lancement.

| Adresse | Contenu |
| --- | --- |
| http://localhost:5173 | Site et admin (`/admin`) en développement : contenu publié lu en direct |
| http://localhost:8080 | Site généré (pages statiques), mis à jour par « Mettre le site à jour » |
| http://localhost:8000/docs | Documentation de l'API |
| http://localhost:8025 | Mailpit : e-mails envoyés en local |

## Tests

```bash
docker compose exec api pytest          # tests de l'API
docker compose exec api ruff check .    # lint Python
docker compose exec frontend npm test   # tests du frontend
docker compose exec frontend npm run lint
```
