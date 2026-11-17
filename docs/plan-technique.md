# Plan technique — Portfolio AYEM

Ce document traduit `docs/conception.md` en décisions d'implémentation. En cas de doute, la conception l'emporte ; les choix faits sur les points ambigus sont listés en section 6 et repris dans `docs/questions.md`.

## 1. Arborescence

```
backend/
  pyproject.toml            dépendances, configuration Ruff et Pytest
  Dockerfile
  entrypoint.sh             migrations + bootstrap + uvicorn
  alembic.ini
  alembic/
    env.py
    versions/               migrations (0001 : les 15 tables)
  app/
    main.py                 fabrique de l'application FastAPI
    config.py               variables d'environnement (pydantic-settings)
    database.py             moteur, session, dépendance get_db
    models.py               les 15 tables (SQLAlchemy 2)
    enums.py                valeurs autorisées (catégorie, état, type de démo…)
    security.py             hachage Argon2, JWT, cookie, dépendance require_admin
    rate_limit.py           SlowAPI (limites par route)
    schemas/                modèles Pydantic v2 (entrée / sortie), un fichier par module
    routers/
      auth.py               connexion, déconnexion, session
      public.py             contenu publié, contact, accès sur demande, consultations
      admin/                un fichier par module de l'admin
    services/
      storage.py            stockage : dossier local ou Supabase Storage
      mailer.py             e-mail : SMTP (Mailpit), Resend ou console
      deploy.py             deploy hook (Vercel ou service local)
      uploads.py            contrôle des fichiers (type, taille, nom régénéré)
      access_codes.py       création et vérification des codes d'accès
      versions.py           historique des versions de projet
      public_content.py     mise en forme du contenu publié (une seule source pour public + aperçu)
      emails.py             textes des e-mails FR/EN
    scripts/
      bootstrap.py          compte admin, 3 métiers, profil vide, contenu d'exemple
      example_content.py    contenu fictif « Exemple » (lot 6)
  tests/                    Pytest : un fichier par routeur + services

frontend/
  package.json, vite.config.ts, tsconfig*.json, eslint.config.js, .prettierrc
  index.html                gabarit commun (client et pré-rendu)
  vercel.json               réécritures (/api, /admin) pour Vercel
  Dockerfile
  scripts/
    content.mjs             emplacements communs aux scripts de publication
    build-static.mjs        enchaîne : contenu → build client → build SSR → pré-rendu
    fetch-content.mjs       récupère le contenu publié et l'écrit en JSON
    prerender.mjs           génère le HTML de chaque page, sitemap.xml, robots.txt
    serve-static.mjs        service local : sert le site généré et joue le rôle du deploy hook
  src/
    main.tsx                entrée navigateur (hydratation)
    entry-server.tsx        entrée du pré-rendu
    App.tsx                 routes publiques + /admin (chargé à la demande)
    index.css               Tailwind + variables de couleurs
    i18n/                   index.ts, fr.json, en.json
    lib/                    api.ts, types.ts, content.ts, metier.ts, demo.ts, seo.ts, localized.ts
    components/             composants partagés (voir section 3)
    pages/                  Home, Projects, ProjectPage, About, Skills, Contact, NotFound
    admin/
      AdminApp.tsx          routes de l'admin, garde d'authentification
      pages/                une page par module
      components/           BilingualField, ZoneEditor, MediaPicker, SortableList…
    test/                   configuration Vitest et données de test

docs/                       conception.md, plan-technique.md, questions.md, guides
docker-compose.yml          db, api, frontend, mailpit, site
.env.example
.github/workflows/ci.yml
```

## 2. Routes de l'API

Préfixe `/api`. « Admin » = cookie JWT obligatoire. « Limité » = limitation de requêtes SlowAPI par adresse IP.

### Public

| Méthode | Chemin | Rôle | Accès |
| --- | --- | --- | --- |
| GET | `/api/health` | État de l'API (utilisé par Docker et le build) | Public |
| GET | `/api/public/site` | Tout le contenu publié hors détail des fiches : profil, métiers, cartes projets, technologies avec leurs projets, parcours | Public |
| GET | `/api/public/projets/{slug}` | Fiche d'un projet publié. Projet confidentiel : seulement l'en-tête (`protege: true`) | Public |
| POST | `/api/public/projets/{slug}/acces` | Échange un code temporaire contre la fiche complète ; enregistre la consultation | Public, limité (10/min) |
| POST | `/api/public/projets/{slug}/demandes-acces` | Demande d'accès (nom, entreprise, e-mail, motif) + notification e-mail | Public, limité (3/min) |
| POST | `/api/public/messages` | Formulaire de contact (champ piège) + notification e-mail | Public, limité (3/min) |
| POST | `/api/public/consultations` | Enregistre une vue de fiche ou un lancement de démo, avec le métier choisi | Public, limité (60/min) |

### Authentification

| Méthode | Chemin | Rôle | Accès |
| --- | --- | --- | --- |
| POST | `/api/auth/connexion` | Vérifie e-mail + mot de passe, pose le cookie JWT, met à jour `derniere_connexion` | Public, limité (5/min) |
| POST | `/api/auth/deconnexion` | Supprime le cookie | Public |
| GET | `/api/auth/moi` | Admin connecté (e-mail, dernière connexion) | Admin |

### Admin (`/api/admin/...`)

| Méthode | Chemin | Rôle |
| --- | --- | --- |
| GET, PUT | `/profil` | Lire / modifier le profil (ligne unique) |
| GET | `/metiers` | Liste des 3 métiers |
| GET, POST | `/projets` | Lister (tous statuts) / créer un projet |
| GET, PUT, DELETE | `/projets/{id}` | Lire / modifier (crée une version) / supprimer |
| POST | `/projets/{id}/statut` | Publier, repasser en brouillon, archiver |
| PUT | `/projets/ordre` | Réordonner les projets |
| GET | `/projets/{id}/apercu` | Fiche au format public, même en brouillon (prévisualisation) |
| GET | `/projets/{id}/versions` | Historique des versions |
| POST | `/projets/{id}/versions/{version_id}/restaurer` | Restaurer une version |
| GET, POST | `/projets/{id}/demos` | Lister / ajouter une démo |
| PUT, DELETE | `/demos/{id}` | Modifier / supprimer une démo |
| GET, POST | `/demos/{id}/etapes` | Lister / ajouter une étape de visite guidée |
| PUT | `/demos/{id}/etapes/ordre` | Réordonner les étapes |
| PUT, DELETE | `/etapes/{id}` | Modifier (zone, légende, image) / supprimer une étape |
| GET, POST | `/technologies` | Lister / créer une compétence |
| PUT | `/technologies/ordre` | Réordonner |
| PUT, DELETE | `/technologies/{id}` | Modifier / supprimer |
| GET, POST | `/parcours` | Lister / créer une entrée de parcours |
| PUT, DELETE | `/parcours/{id}` | Modifier / supprimer |
| GET, POST | `/medias` | Bibliothèque (filtres `projet_id`, `type`) / import d'un fichier (multipart) |
| PUT | `/medias/ordre` | Réordonner la galerie d'un projet |
| PUT, DELETE | `/medias/{id}` | Modifier légende / rattachement, supprimer (fichier compris) |
| GET | `/messages` | Messages de contact |
| PUT, DELETE | `/messages/{id}` | Marquer traité / supprimer |
| GET | `/demandes-acces` | Demandes d'accès |
| POST | `/demandes-acces/{id}/accepter` | Génère un code (7 jours), l'envoie par e-mail |
| POST | `/demandes-acces/{id}/refuser` | Refuse et prévient le visiteur |
| POST | `/demandes-acces/{id}/revoquer` | Invalide le code |
| GET | `/demandes-acces/{id}/consultations` | Journal des consultations faites avec ce code |
| GET | `/statistiques` | Vues par projet, démos lancées, métiers choisis, derniers messages et demandes |
| GET, POST | `/publication` | État du deploy hook / « Mettre le site à jour » |

Documentation automatique : `http://localhost:8000/docs` (désactivée quand `ENVIRONMENT=production`).

## 3. Pages et composants du frontend

### Pages publiques

| Route | Page | Composants principaux |
| --- | --- | --- |
| `/` | `Home` | `MetierPicker`, `ProjectCard` ×3, boutons Projets · CV · Contact |
| `/projets` | `Projects` | `MetierPicker`, `ProjectFilters`, `ProjectCard` |
| `/projets/:slug` | `ProjectPage` | `ProjectView` (fiche), `AccessGate` (projet confidentiel) |
| `/a-propos` | `About` | `Markdown`, `Timeline` |
| `/competences` | `Skills` | `SkillGroup`, `LevelBadge` |
| `/contact` | `Contact` | `ContactForm` |
| `*` | `NotFound` | — |

### Pages de l'admin (`/admin/...`, chargées à la demande, absentes du menu public)

`Login`, `Dashboard`, `ProjectList`, `ProjectEditor` (onglets Général · Contenu · Galerie · Démos · Historique), `TourEditor`, `ProjectPreview`, `SkillsAdmin`, `TimelineAdmin`, `ProfileAdmin`, `MediaLibrary`, `Messages`, `AccessRequests`, `Publication`.

### Composants réutilisés

| Composant | Utilisé par | Rôle |
| --- | --- | --- |
| `DemoPlayer` | fiche publique, aperçu admin, prévisualisation de l'éditeur de visite | **Lecteur unique** : choisit le lecteur selon `demo.type` (`VideoPlayer`, `TourPlayer`, `NotebookViewer`, `PlaygroundFrame`, `SandboxLauncher`, `ExternalLink`) et affiche les autres démos en onglets |
| `TourPlayer` | `DemoPlayer`, `TourEditor` (prévisualisation) | Visite guidée : zone cliquable, barre de progression, Précédent / Suivant, clavier |
| `DeviceFrame` | `TourPlayer`, `TourEditor` | Cadre navigateur, téléphone ou aucun |
| `ProjectView` | `ProjectPage`, `ProjectPreview` (admin) | Fiche projet complète : l'aperçu admin est exactement le rendu public |
| `ProjectBadges` (+ `Badge`) | `ProjectCard`, `ProjectView`, `ProjectList` (admin) | Les 3 badges Code · État · Démo |
| `ProjectCard` | `Home`, `Projects`, `Skills` (projets qui prouvent) | Carte projet |
| `MetierPicker` | `Home`, `Projects`, `Skills` | Choix du métier, écrit `?metier=` dans l'URL |
| `Markdown` | fiche, À propos | Rendu des textes longs (Markdown, sans HTML brut) |
| `BilingualField` | tous les formulaires de l'admin | Champs FR et EN côte à côte (ligne ou zone de texte) |
| `MediaPicker` | éditeur de projet, démos, visite, parcours, profil | Choisir un fichier de la bibliothèque ou en importer un |
| `SortableList` | projets, compétences, étapes, galerie | Réordonner (boutons monter / descendre, utilisables au clavier) |
| `ZoneEditor` | `TourEditor` | Tracer la zone cliquable à la souris, coordonnées en % |

Tous les libellés passent par `src/i18n/fr.json` et `en.json` ; les textes de contenu viennent de la base au format `{"fr": "...", "en": "..."}` et sont lus par un seul utilitaire (`localized()`), avec repli sur le français si l'anglais est vide.

## 4. Publication statique

**Outil retenu : le pré-rendu natif de Vite (build SSR + `renderToString` de React), piloté par un petit script Node.** Pas de framework supplémentaire.

Pourquoi :

- la conception impose React + Vite + React Router ; ce mécanisme les garde tels quels (Next.js ou Astro auraient changé la stack) ;
- le site public et l'admin restent dans le même dépôt et le même build ;
- le script fait moins de 200 lignes, sans dépendance à un greffon tiers qui pourrait ne plus être maintenu.

Étapes de `npm run build` (c'est la commande que lance Vercel, et celle du service local) :

1. `fetch-content.mjs` appelle `GET /api/public/site` puis `GET /api/public/projets/{slug}` pour chaque projet publié (avec nouvelles tentatives pendant environ 3 minutes si l'API est en veille) et enregistre le contenu en fichiers JSON (dossier de travail `.content/`), copiés ensuite dans le site sous `/data/site.json` et `/data/projets/{slug}.json`.
2. `vite build` produit l'application navigateur.
3. `vite build --ssr` produit la version serveur de l'application.
4. `prerender.mjs` rend chaque page publique en HTML (`/`, `/projets`, `/projets/{slug}`, `/a-propos`, `/competences`, `/contact`, `404`), y insère le titre, la description, les balises Open Graph et le contenu nécessaire à l'hydratation, puis écrit `sitemap.xml` et `robots.txt`. L'admin reçoit une coquille vide `admin/index.html` (non indexée).

**Quand l'API est arrêtée**, le visiteur reçoit des fichiers HTML et JSON déjà générés : toutes les pages, la navigation, les filtres, le choix du métier, les visites guidées, les vidéos et les notebooks fonctionnent. Seules les actions qui écrivent ont besoin de l'API : formulaire de contact, demande d'accès, saisie d'un code, statistiques de consultation (ces dernières échouent en silence). Les formulaires affichent alors un message d'attente puis d'erreur claire.

Les fiches des projets confidentiels ne contiennent dans les fichiers statiques que leur en-tête ; le reste n'est remis par l'API qu'après vérification du code.

**En développement** (`http://localhost:5173`), le serveur Vite redirige `/data/site.json` et `/data/projets/*.json` vers l'API : le code du site n'a qu'un seul chemin de lecture, et on voit le contenu publié en direct. **Le site généré** est servi à part sur `http://localhost:8080` par le service `site`.

Langues : les pages sont pré-rendues en français (langue par défaut). Le bouton FR/EN bascule côté navigateur et le choix est mémorisé (voir `docs/questions.md`, Q7).

## 5. Remplacements locaux des services externes

| Service | Variable | En local (défaut) | En ligne |
| --- | --- | --- | --- |
| Base de données | `DATABASE_URL` | conteneur `db` (PostgreSQL 16) | chaîne de connexion Supabase |
| Fichiers | `STORAGE_BACKEND` = `local` \| `supabase` | dossier `uploads/` servi par l'API sur `/uploads` (et par le service `site` pour le site généré) | Supabase Storage (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`) |
| E-mails | `EMAIL_BACKEND` = `smtp` \| `resend` \| `console` | `smtp` vers Mailpit (`SMTP_HOST=mailpit`, boîte visible sur `http://localhost:8025`) | `resend` (`RESEND_API_KEY`) |
| Deploy hook | `DEPLOY_HOOK_URL` | `http://site:8080/__deploy` : le service `site` lance la commande `npm run build` et sert le résultat. La même commande peut être lancée à la main : `docker compose exec site npm run build` | URL du deploy hook Vercel |
| Playgrounds | (aucune) | une démo « playground » sans adresse affiche « indisponible » ; on peut aussi saisir l'adresse d'une application Gradio locale | adresse du Space Hugging Face |

Le code de l'API ne contient aucun `if local` dispersé : chaque service a une interface et deux implémentations, choisies au démarrage par la variable.

## 6. Points ambigus et choix faits

Chaque point est détaillé dans `docs/questions.md`.

| N° | Sujet | Choix |
| --- | --- | --- |
| Q1 | `projet.acces_code` | C'est le badge **Code** : `public`, `prive`, `confidentiel`. Un projet `confidentiel` active l'accès sur demande |
| Q2 | Valeurs avec accents | Stockées sans accent (`academique`, `publie`, `archive`) ; l'affichage accentué vient des traductions |
| Q3 | Champs ajoutés aux tables | `metier.slug`, `media.nom`, `demande_acces.date`, quelques dates ; listés dans Q3 |
| Q4 | Contenu du profil | `profil.presentation` est un JSON à sections (accroche, profil, orientation, méthode), comme `projet.contenu` |
| Q5 | Compétences pertinentes pour un métier | Déduites des projets rattachés au métier (pas de nouvelle table) |
| Q6 | Statistiques « métier choisi » | Enregistré avec chaque consultation de fiche ou de démo |
| Q7 | Pages anglaises | Pré-rendu en français ; bascule EN côté navigateur |
| Q8 | Cookie admin entre Vercel et Render | L'API est appelée via `/api` sur le même domaine (réécriture Vercel) : le cookie reste « first-party » |
| Q9 | Connexion en un clic du bac à sable | Le bouton ouvre `adresse_connexion?role=...` dans un nouvel onglet ; le projet présenté gère le jeton |
| Q10 | Format des textes longs | Markdown (sans HTML brut) |
| Q11 | Signature des commits | Commits signés par clé SSH dans l'environnement de l'agent |
