# Guide de déploiement pas à pas

Ce guide met le portfolio en ligne sur des offres gratuites. Comptez une à deux heures.

**À lire d'abord**

- Les écrans de ces services changent souvent : les noms de boutons ci-dessous peuvent différer légèrement. Les conditions des offres gratuites aussi : revérifiez-les au moment de créer chaque compte.
- Ne mettez **jamais** une clé dans le dépôt Git. Toutes les clés se saisissent dans les écrans « Environment variables » de Render et de Vercel.
- Gardez un bloc-notes ouvert (hors du dépôt) pour y coller les valeurs au fur et à mesure.

**Vue d'ensemble**

| Élément | Hébergeur | Compte à créer |
| --- | --- | --- |
| Base de données + fichiers | Supabase | https://supabase.com |
| API | Render | https://render.com |
| Site public + admin | Vercel | https://vercel.com |
| E-mails | Resend | https://resend.com |
| Playgrounds ML (facultatif) | Hugging Face Spaces | https://huggingface.co |

Ordre à suivre : Supabase → Resend → Render → Vercel → retour sur Render → vérifications. Avant de commencer, fusionnez les pull requests dans `main`.

---

## Étape 1 — Supabase (base de données et fichiers)

1. Créez un compte sur https://supabase.com, puis **New project**. Choisissez un nom, un **mot de passe de base de données** (notez-le) et une région proche de vos visiteurs (Europe de l'Ouest, par exemple).
2. **Chaîne de connexion.** Bouton **Connect** en haut du projet → rubrique **Session pooler** → copiez l'adresse de type `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-….pooler.supabase.com:5432/postgres` et remplacez `[YOUR-PASSWORD]` par votre mot de passe. → à noter comme **`DATABASE_URL`**.
   - Prenez bien « Session pooler » (port 5432) : la connexion « Direct » ne fonctionne pas depuis Render sur l'offre gratuite.
   - Si le mot de passe contient des caractères spéciaux (`@`, `#`, `/`…), choisissez-en plutôt un sans.
3. **Stockage.** Menu **Storage → New bucket** : nom `portfolio`, cochez **Public bucket**.
4. **Clés.** Menu **Project Settings → API** (ou **API Keys**) :
   - **Project URL** (`https://xxxx.supabase.co`) → **`SUPABASE_URL`**
   - clé **service_role** (ou « secret key ») → **`SUPABASE_SERVICE_KEY`**. Cette clé donne tous les droits : elle ne va que dans Render.

**À vérifier :** le bucket `portfolio` apparaît dans Storage avec la mention « Public ». Les tables seront créées automatiquement au premier démarrage de l'API.

> L'offre gratuite met en pause un projet inactif depuis plusieurs jours. Vérifiez la règle en vigueur ; en cas de pause, le site public reste affiché (pages statiques) mais l'admin, le formulaire de contact et les images hébergées sur Supabase sont indisponibles jusqu'à la reprise du projet.

## Étape 2 — Resend (e-mails)

1. Créez un compte sur https://resend.com.
2. Menu **API Keys → Create API Key** → **`RESEND_API_KEY`**.
3. **Adresse d'expédition (`EMAIL_FROM`)** :
   - sans nom de domaine à vous : `Portfolio <onboarding@resend.dev>`. Dans ce mode, Resend n'envoie **qu'à l'adresse e-mail de votre compte Resend**. Vous recevrez donc bien les notifications (messages, demandes d'accès) si `NOTIFICATION_EMAIL` est cette adresse, mais **les visiteurs ne recevront pas leur code d'accès** : l'admin affiche le code à l'acceptation, envoyez-le alors vous-même ;
   - avec un nom de domaine vérifié dans Resend (menu **Domains**) : `Portfolio <contact@votre-domaine>`, et tous les e-mails partent normalement.

## Étape 3 — Render (API)

1. Créez un compte sur https://render.com et reliez votre compte GitHub.
2. **New → Web Service** → choisissez le dépôt `portfolio`.
3. Réglages :
   - **Root Directory** : `backend`
   - **Language / Runtime** : `Docker` (Render utilise `backend/Dockerfile`)
   - **Branch** : `main`
   - **Instance Type** : Free
   - **Health Check Path** : `/api/health`
4. **Environment Variables** — saisissez :

| Variable | Valeur |
| --- | --- |
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | la chaîne notée à l'étape 1 |
| `SECRET_KEY` | une longue valeur aléatoire. Pour en créer une : `python -c "import secrets; print(secrets.token_urlsafe(48))"` (ou le bouton « Generate » de Render) |
| `ADMIN_EMAIL` | votre e-mail de connexion à l'admin |
| `ADMIN_PASSWORD` | un mot de passe long et unique |
| `COOKIE_SECURE` | `true` |
| `TRUSTED_PROXY_COUNT` | `1` |
| `STORAGE_BACKEND` | `supabase` |
| `SUPABASE_URL` | notée à l'étape 1 |
| `SUPABASE_SERVICE_KEY` | notée à l'étape 1 |
| `SUPABASE_BUCKET` | `portfolio` |
| `EMAIL_BACKEND` | `resend` |
| `RESEND_API_KEY` | notée à l'étape 2 |
| `EMAIL_FROM` | voir étape 2 |
| `NOTIFICATION_EMAIL` | l'adresse où recevoir les notifications |
| `SEED_EXAMPLE_CONTENT` | `true` pour avoir les 3 projets d'exemple en brouillon, sinon `false` |

   `FRONTEND_ORIGINS`, `SITE_URL` et `DEPLOY_HOOK_URL` seront ajoutées à l'étape 5.

5. **Create Web Service**, puis attendez la fin du déploiement. Notez l'adresse du service : `https://xxxx.onrender.com` → **adresse de l'API**.

**À vérifier :**

```bash
curl https://xxxx.onrender.com/api/health
```
doit répondre `{"status":"ok"}`. Dans les journaux (onglet **Logs**), vous devez voir `Running upgrade -> 0001` puis `bootstrap: Compte admin créé pour …`. Dans Supabase (**Table Editor**), 15 tables sont apparues.

> Le compte admin n'est créé qu'une fois, au premier démarrage. Changer `ADMIN_PASSWORD` plus tard dans Render ne modifie pas le mot de passe existant.
>
> Sur l'offre gratuite, l'API s'endort après une période sans visite et met jusqu'à une minute à se réveiller. Seuls l'admin et les formulaires le ressentent ; les pages du site, elles, sont statiques.

## Étape 4 — Vercel (site public et admin)

1. **Une ligne à modifier dans le dépôt.** Ouvrez `frontend/vercel.json` et remplacez `https://REMPLACER-PAR-VOTRE-API.onrender.com` par l'adresse de l'API (étape 3), en gardant la fin `/api/:path*`. Validez ce changement dans `main` (par une pull request). Cette adresse n'est pas un secret. Elle permet au navigateur d'appeler l'API par la même adresse que le site, ce qui garde le cookie de l'admin en sécurité.
2. Créez un compte sur https://vercel.com avec GitHub, puis **Add New → Project** → importez le dépôt `portfolio`.
3. Réglages :
   - **Root Directory** : `frontend`
   - **Framework Preset** : `Other` (la commande de build et le dossier de sortie viennent de `vercel.json`)
4. **Environment Variables** :

| Variable | Valeur |
| --- | --- |
| `API_URL` | l'adresse de l'API (`https://xxxx.onrender.com`) |
| `SITE_URL` | l'adresse du site. Au premier déploiement vous ne la connaissez pas encore : laissez vide, puis revenez la saisir (point 6) |

5. **Deploy.** Le build lit le contenu publié auprès de l'API (il patiente si elle dort) puis génère les pages. Notez l'adresse du site : `https://votre-projet.vercel.app` → **adresse du site**.
6. Dans **Settings → Environment Variables**, renseignez `SITE_URL` avec l'adresse du site (sans `/` final). Elle sert aux liens du `sitemap.xml` et aux aperçus de partage.
7. **Deploy hook.** **Settings → Git → Deploy Hooks** : nom `Mettre le site à jour`, branche `main` → **Create Hook**. Copiez l'adresse obtenue → **`DEPLOY_HOOK_URL`**. Traitez-la comme un secret : quiconque la connaît peut relancer un build.

**À vérifier :** l'adresse du site affiche l'accueil (vide pour l'instant : « Aucun projet publié ») ; `https://votre-projet.vercel.app/api/health` répond `{"status":"ok"}` (preuve que la réécriture vers l'API fonctionne).

## Étape 5 — Retour sur Render (relier l'API au site)

Dans le service Render → **Environment**, ajoutez :

| Variable | Valeur |
| --- | --- |
| `FRONTEND_ORIGINS` | l'adresse du site (`https://votre-projet.vercel.app`) |
| `SITE_URL` | la même adresse |
| `DEPLOY_HOOK_URL` | l'adresse du deploy hook (étape 4) |

Enregistrez : Render redéploie l'API.

## Étape 6 — Vérifications finales

Faites-les dans l'ordre, sur l'adresse du site.

| N° | Action | Ce que vous devez voir |
| --- | --- | --- |
| 1 | Ouvrir `/admin` et vous connecter | Le tableau de bord (patientez si « Connexion au serveur… ») |
| 2 | **Profil** : remplir et enregistrer ; **Médias** : importer une image | « Enregistré. » ; l'image apparaît, et aussi dans Supabase → Storage → `portfolio` |
| 3 | Créer un projet de test, le **Publier**, puis **Publication → Mettre le site à jour** | « Mise à jour du site lancée. » Dans Vercel → **Deployments**, un nouveau déploiement démarre |
| 4 | Deux minutes plus tard, ouvrir le site | Le projet est sur `/projets` ; sa fiche s'ouvre |
| 5 | Envoyer un message depuis `/contact` | « Message envoyé » ; le message est dans l'admin et vous recevez l'e-mail de notification |
| 6 | Ouvrir `/sitemap.xml` | Les adresses commencent par l'adresse de votre site |
| 7 | Coller l'adresse d'une fiche dans un message LinkedIn ou WhatsApp (sans l'envoyer) | L'aperçu montre le titre et le résumé du projet |
| 8 | Dans Render, **Suspend** le service quelques minutes, puis recharger le site | Le site s'affiche toujours. Pensez à **Resume** ensuite |
| 9 | Supprimer le projet de test, puis « Mettre le site à jour » | Il disparaît du site |

Changez enfin `SEED_EXAMPLE_CONTENT` en `false` si vous ne voulez plus des exemples, et supprimez-les dans l'admin.

## Étape 7 — Hugging Face Spaces (playgrounds, facultatif)

Un Space par modèle (TelcomCI, CinéScope…).

1. Créez un compte sur https://huggingface.co, puis **New Space** : SDK **Gradio** (ou Streamlit), visibilité **Public**, matériel gratuit.
2. Déposez-y l'application (`app.py`, `requirements.txt`) et le modèle entraîné. Attendez l'état « Running ».
3. L'adresse à intégrer est celle du Space « en direct » : menu **⋮ → Embed this Space → Direct URL**, de la forme `https://utilisateur-nom-du-space.hf.space`.
4. Dans l'admin : projet → **Démos** → ajouter un « Playground » → collez cette adresse → Enregistrer → Mettre le site à jour.

**À vérifier :** sur la fiche du projet, le playground s'affiche dans la page et répond à une saisie. Un Space gratuit s'endort lui aussi : son premier chargement peut prendre une trentaine de secondes (la fiche le signale).

## Variables : récapitulatif

| Où | Variables |
| --- | --- |
| **Render** | `ENVIRONMENT`, `DATABASE_URL`, `SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `COOKIE_SECURE`, `TRUSTED_PROXY_COUNT`, `STORAGE_BACKEND`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`, `EMAIL_BACKEND`, `RESEND_API_KEY`, `EMAIL_FROM`, `NOTIFICATION_EMAIL`, `FRONTEND_ORIGINS`, `SITE_URL`, `DEPLOY_HOOK_URL`, `SEED_EXAMPLE_CONTENT` |
| **Vercel** | `API_URL`, `SITE_URL` |
| **Dépôt** | uniquement l'adresse de l'API dans `frontend/vercel.json` |

## Plus tard

- **Nom de domaine personnel** : ajoutez-le dans Vercel (**Settings → Domains**), puis remplacez l'adresse du site dans `SITE_URL` (Vercel et Render) et `FRONTEND_ORIGINS` (Render), et relancez « Mettre le site à jour ».
- **Mises à jour du code** : chaque fusion dans `main` redéploie automatiquement l'API (Render) et le site (Vercel). Les migrations de base s'appliquent toutes seules au démarrage de l'API.
- **Mot de passe admin oublié** : il n'y a pas d'écran de réinitialisation (un seul compte, voir la conception). Supprimez la ligne de la table `admin` dans Supabase (Table Editor), mettez le nouveau mot de passe dans `ADMIN_PASSWORD` sur Render et redémarrez le service : le compte est recréé.

## Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| Le build Vercel échoue avec « Impossible de lire …/api/public/site » | `API_URL` absente ou fausse, ou API en panne | Vérifiez `API_URL` dans Vercel et `curl …/api/health` sur Render, puis relancez le déploiement |
| L'admin affiche « Le serveur ne répond pas » en permanence | La réécriture `/api` de `frontend/vercel.json` ne pointe pas vers votre API | Corrigez l'adresse (étape 4, point 1) et redéployez |
| Connexion à l'admin acceptée, puis retour immédiat à la page de connexion | Vous utilisez l'adresse Render au lieu de celle du site, ou `COOKIE_SECURE` est mal réglée | Ouvrez l'admin par l'adresse du site ; `COOKIE_SECURE=true` |
| « La publication n'est pas configurée » | `DEPLOY_HOOK_URL` absente sur Render | Étape 5 |
| L'API ne démarre pas, erreur de connexion à la base dans les journaux | Chaîne `DATABASE_URL` incorrecte (mot de passe, mode « Direct » au lieu de « Session pooler ») | Recopiez-la depuis Supabase (étape 1, point 2) |
| L'import d'une image échoue avec une erreur du serveur | Bucket absent ou non public, clé `service_role` incorrecte | Étape 1, points 3 et 4 |
| L'import d'une vidéo volumineuse échoue | Limite de taille de requête de l'hébergeur | Compressez la vidéo, ou publiez-la sur YouTube en « non répertorié » et collez le lien |
| Les visiteurs ne reçoivent pas leur code d'accès | Resend sans domaine vérifié | Étape 2, point 3 |
