# Portfolio AYEM

Portfolio professionnel d'Ayem : un site public où chaque projet peut être vu, parcouru ou essayé, et un panneau d'administration (`/admin`) pour tout gérer sans toucher au code.

| Document | Contenu |
| --- | --- |
| [`docs/conception.md`](docs/conception.md) | La conception validée (source de vérité) |
| [`docs/plan-technique.md`](docs/plan-technique.md) | Arborescence, routes de l'API, composants, publication statique |
| [`docs/questions.md`](docs/questions.md) | Choix faits sur les points que la conception ne tranchait pas |
| [`docs/guide-admin.md`](docs/guide-admin.md) | Utiliser l'admin : projet, visite guidée, bac à sable, demandes d'accès, publication |
| [`docs/guide-deploiement.md`](docs/guide-deploiement.md) | Mettre le site en ligne pas à pas (Supabase, Render, Vercel, Hugging Face) |

## Installation

Il faut seulement [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine avec Docker Compose). Aucun compte en ligne n'est nécessaire.

```bash
git clone https://github.com/ayem34/portfolio.git
cd portfolio
```

Facultatif : pour choisir l'e-mail et le mot de passe de l'admin **avant le premier lancement**, copier `.env.example` en `.env` et modifier `ADMIN_EMAIL` et `ADMIN_PASSWORD`. Sans fichier `.env`, les valeurs par défaut sont `admin@example.com` / `changez-moi`.

## Lancement local

```bash
docker compose up
```

Le premier lancement prend quelques minutes (téléchargement des images). Il crée les tables, le compte admin et **trois projets d'exemple fictifs, en brouillon** (titres commençant par « Exemple — »), qui montrent chaque type de démo. Ils ne sont pas visibles sur le site et peuvent être supprimés.

## Adresses à ouvrir

| Adresse | Quoi |
| --- | --- |
| http://localhost:5173 | **Site public** en développement (affiche en direct ce qui est publié) |
| http://localhost:5173/admin | **Admin** |
| http://localhost:8080 | **Site généré** : les pages statiques, comme en ligne. Mis à jour par le bouton « Mettre le site à jour » de l'admin ; reste affiché si l'API est arrêtée |
| http://localhost:8000/docs | **Documentation de l'API** (toutes les routes, essayables) |
| http://localhost:8025 | **Mailpit** : boîte de réception de test (notifications, codes d'accès) |

Arrêter : `Ctrl+C`, ou `docker compose down`. Tout effacer (base comprise) pour repartir de zéro : `docker compose down -v`, puis vider le dossier `uploads/`.

## Les services

| Service | Rôle | En ligne, il est remplacé par |
| --- | --- | --- |
| `db` | PostgreSQL | Supabase |
| `api` | API FastAPI ; les fichiers importés vont dans `uploads/` | Render + Supabase Storage |
| `frontend` | Serveur de développement (site + admin) | — |
| `site` | Génère et sert les pages statiques ; joue le rôle du deploy hook | Vercel |
| `mailpit` | Reçoit les e-mails | Resend |

Chaque remplacement se choisit par une variable d'environnement, documentée dans [`.env.example`](.env.example).

## Commandes de test

```bash
docker compose exec api pytest                 # tests de l'API (PostgreSQL de test)
docker compose exec api ruff check .           # lint Python
docker compose exec api ruff format --check .  # mise en forme Python

docker compose exec frontend npm test              # tests du frontend (Vitest)
docker compose exec frontend npm run lint          # ESLint
docker compose exec frontend npm run format:check  # Prettier
docker compose exec frontend npm run typecheck     # TypeScript strict
```

Régénérer le site à la main (ce que fait le bouton « Mettre le site à jour ») :

```bash
docker compose exec site npm run build
```

Les mêmes vérifications tournent sur GitHub à chaque pull request (`.github/workflows/ci.yml`).

## Organisation du dépôt

```
backend/      API FastAPI, modèles SQLAlchemy, migrations Alembic, tests Pytest
frontend/     React + TypeScript + Vite + Tailwind : site public, admin, scripts de publication
docs/         conception, plan technique, questions, guides
docker-compose.yml
.env.example
```

## Sécurité, en bref

- Aucun secret dans le dépôt : tout passe par des variables d'environnement.
- Admin protégé par un cookie de session `httpOnly`, mot de passe haché (Argon2), 5 tentatives de connexion par minute.
- Fichiers importés contrôlés (type, taille, contenu) et renommés.
- Projets confidentiels : seul l'en-tête est public ; le reste demande un code temporaire (7 jours), stocké haché.
