# CLAUDE.md — Portfolio AYEM

Ce fichier donne les règles de travail permanentes pour tout agent qui intervient dans ce dépôt.
Il est lu à chaque session. La conception complète est dans `docs/conception.md` : c'est la source de vérité.

## Le projet en une phrase

Portfolio professionnel d'Ayem (AYEMOU BAHE Marie Laure Thérèse), étudiante en Master 2 Data Science à l'IDSI / INP-HB, qui vise trois métiers : Data Analyst, Data Engineer et Développeuse Full Stack. Chaque projet doit pouvoir être vu, parcouru ou essayé par un recruteur sans compte et sans déploiement préalable. Un panneau d'administration permet de tout gérer sans toucher au code.

## Règles absolues

1. **Suivre `docs/conception.md`.** Si une décision manque ou si deux sections se contredisent, ne pas inventer : noter la question dans `docs/questions.md`, choisir l'option la plus simple et la plus réversible, l'indiquer clairement dans la description de la pull request, puis continuer.
2. **Ne jamais pousser sur `main`.** Une branche par lot, une pull request par lot (voir « Git »).
3. **Aucun secret dans le dépôt.** Toutes les clés passent par des variables d'environnement, documentées dans `.env.example`.
4. **Tout doit tourner en local sans aucun compte externe**, avec `docker compose up` (section 9 de la conception, « Fonctionnement en local »).
5. **Aucun texte affiché écrit en dur.** Le contenu vient de la base ; les libellés d'interface passent par les fichiers de traduction FR/EN.
6. **Pas de duplication de code.** Si une duplication semble inévitable, l'expliquer dans la PR avant de la faire.

## Organisation du dépôt

```
backend/      FastAPI, SQLAlchemy 2, Alembic, Pydantic v2, tests Pytest
frontend/     React + TypeScript + Vite + Tailwind, site public et /admin
docs/         conception.md, plan-technique.md, questions.md, guides
docker-compose.yml
.env.example
README.md
```

## Conventions

- **Noms de tables et de champs :** exactement ceux de la section 7 de `docs/conception.md` (en français, snake_case).
- **Reste du code :** noms de fonctions, variables et composants en anglais, cohérents d'un fichier à l'autre. Une fois un nom choisi, le garder partout.
- **TypeScript en mode strict.** Pas de `any` sans commentaire justificatif.
- **Qualité :** Ruff (Python), ESLint + Prettier (frontend). La CI doit passer avant toute PR.
- **API :** REST, préfixe `/api`, routes d'admin sous `/api/admin` protégées par JWT en cookie `httpOnly`. Documentation automatique FastAPI accessible en local.
- **Design :** palette corail/orange sur fond sombre, sections claires en alternance, couleurs définies en variables CSS (pour pouvoir ajouter un thème clair plus tard). Contraste suffisant sur les champs de saisie, pas d'icônes flottantes répétitives. Entièrement responsive.
- **Accessibilité :** navigation au clavier, textes alternatifs, focus visible, contraste WCAG AA.

## Git

- Branches : `lot-1-fondations`, `lot-2-api`, `lot-3-admin`, `lot-4-site-public`, `lot-5-publication`, `lot-6-livraison`.
- Chaque branche part de la branche du lot précédent. La PR du lot 1 cible `main` ; la PR du lot N cible la branche du lot N-1 (PR empilées). Ayem les fusionne dans l'ordre.
- Petits commits clairs, messages en français, au format `type(portée): description` (ex. `feat(api): ajouter les routes des démos`).
- Les commits doivent apparaître comme « Verified » sur GitHub. Si la signature n'est pas possible dans l'environnement, le signaler dans la première PR au lieu de continuer silencieusement.
- - Ne jamais ajouter de ligne « Co-Authored-By » ni de mention de Claude dans les messages de commit ou les descriptions de pull request.

## Description attendue de chaque pull request

Ayem relit chaque PR. Elle doit pouvoir comprendre sans lire tout le code :

1. **Ce que fait ce lot** et ce qu'on voulait obtenir.
2. **Pourquoi** ces choix, et ce qui casserait sans eux.
3. **Comment tester**, commande par commande, avec pour chacune **ce qu'il faut regarder dans le résultat**. Les tests de l'API se font aussi avec `curl`.
4. **Résultats des tests** présentés sous forme de tableau.
5. **Questions ou écarts** par rapport à la conception, s'il y en a.

## Ce que l'agent ne fait pas

- Créer des comptes en ligne (Vercel, Render, Supabase, Hugging Face, service d'e-mail) ou y saisir des clés.
- Inventer du vrai contenu sur Ayem. Le contenu d'exemple est fictif, marqué « Exemple » et laissé en brouillon.
- Publier BanqueCI ou KÔVO : sans autorisation écrite du client, ils restent en brouillon.
