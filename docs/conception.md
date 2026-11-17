# Portfolio AYEM — Description finale du projet

Nov 17, 2026 · @Ayem

## 1. Vision et cibles

Le portfolio est une plateforme personnelle qui prouve ce qu'Ayem sait faire : chaque projet peut être vu, parcouru ou essayé par un recruteur, sans compte et sans attendre qu'il soit déployé.

**Profil présenté :** AYEMOU BAHE Marie Laure Thérèse (Ayem), étudiante en Master 2 Data Science à l'IDSI / INP-HB (Yamoussoukro), issue d'une Licence en génie logiciel, avec un stage de développement à la DSI de l'INP-HB (React + Laravel).

**Cible principale :** les recruteurs et entreprises (stages, premiers emplois), sur trois métiers :

| Métier visé | Ce que le recruteur doit trouver en moins de 2 minutes |
| --- | --- |
| Data Analyst | Analyses, tableaux de bord, notebooks lisibles, résultats chiffrés |
| Data Engineer | Pipelines, Big Data (Hadoop, Spark), bases SQL/NoSQL, Docker |
| Développeuse Full Stack | Applications complètes, API, administration, démos utilisables |

**Trois principes :**

1. **Prouver plutôt qu'affirmer** : chaque compétence renvoie aux projets qui l'utilisent.
2. **Tout projet est consultable** : même non déployé, il a au moins une visite guidée ou une vidéo.
3. **Zéro friction** : aucun identifiant demandé au visiteur ; les démos s'ouvrent en un clic.

## 2. Ce qui change par rapport à la proposition initiale

| Proposition initiale | Décision retenue | Pourquoi |
| --- | --- | --- |
| 4 statuts mélangeant code, maturité et démo | 3 badges indépendants : **Code**, **État**, **Démo** | Un projet peut avoir un code privé et une démo disponible |
| Captures d'écran comme seule preuve hors ligne | **Échelle de preuves** en 6 niveaux, dont la visite guidée interactive | Le visiteur « utilise » le projet même non déployé |
| Démo en ligne avec identifiants | **Bac à sable** + connexion en un clic par rôle | Un recruteur ne remplit jamais un formulaire de connexion |
| 6 filtres par domaine (NLP, Deep Learning…) | **Entrée par métier** + filtres techniques secondaires | Les recruteurs cherchent un métier, pas une sous-discipline |
| Compétences en liste avec niveaux | Niveaux **+ projets qui prouvent** chaque compétence | Le recruteur vérifie au lieu de croire |
| Parcours et Certifications séparés | **Une seule frise** avec badges (diplôme, certification, hackathon, challenge) | Évite deux pages peu remplies |
| Chiffres clés en accueil | **3 projets phares** avec leur badge de démo | Plus parlant pour un profil junior |
| — | Rubrique **« Comment je travaille »** dans chaque fiche | Montre la conception avant le code |
| CMS complet dès le départ | **Version finale complète, construite par lots vérifiés** | Un seul chantier, avec des tests à la fin de chaque lot |
| Pages publiques servies par l'API | **Pages publiques générées à la publication** | Le site s'affiche même si le serveur gratuit est en veille |
| « Étudiante en Master 1 » | **Master 2** | Information à jour |

**Conservé des décisions déjà prises :** palette corail/orange sur fond sombre avec alternance de sections claires, admin dans le même dépôt que le site public (routes séparées par React Router), admin protégé par JWT.

**Modifié :** les technologies d'un projet passent d'une liste JSON à une vraie table reliée aux projets. C'est nécessaire pour afficher « Spark → utilisé dans 2 projets » sur la page Compétences.

## 3. Arborescence et pages publiques

Le site public compte 5 pages ; l'administration vit sur une route privée `/admin`, absente du menu.

| Route | Page | Contenu |
| --- | --- | --- |
| `/` | Accueil | Nom, titre « Étudiante en Master 2 Data Science », positionnement en 2 phrases, choix du métier (Data Analyst / Data Engineer / Full Stack), 3 projets phares, boutons Projets · CV · Contact |
| `/projets` | Projets | Entrée par métier, filtres secondaires (domaine, technologie, type de démo, catégorie personnel/académique/collaboratif), cartes avec les 3 badges |
| `/projets/:slug` | Fiche projet | Voir section 4 |
| `/a-propos` | À propos | Profil (du génie logiciel à la Data), orientation, « Comment je travaille », frise du parcours (formations, stage, certifications, hackathons, challenges) |
| `/competences` | Compétences | Groupées par domaine, niveau (Notions / Pratique / Bonne maîtrise), projets qui les prouvent |
| `/contact` | Contact | E-mail, LinkedIn, GitHub (ayem34), formulaire, CV en PDF |

**Choix du métier :** il est mémorisé dans l'URL (`?metier=data-engineer`). Il réordonne les projets et met en tête les compétences pertinentes. Ayem peut ainsi envoyer un lien ciblé à chaque recruteur.

**Identité visuelle :** corail/orange sur fond sombre, sections claires en alternance (notamment À propos), typographie affirmée, entièrement responsive. À surveiller : contraste des champs de saisie, pas d'icônes flottantes répétitives.

## 4. Fiche projet et système de démonstration

Chaque fiche répond à trois questions : de quoi s'agit-il, comment Ayem a travaillé, et comment le voir ou l'essayer maintenant.

### 4.1 Contenu d'une fiche

1. En-tête : titre, résumé d'une phrase, métiers concernés, 3 badges, bouton principal de démo.
2. Contexte et problématique.
3. Objectifs et résultats (chiffrés quand c'est possible : F1, précision, volume de données…).
4. **Comment je travaille** : règles métier, schéma d'architecture, modèle de données, parcours utilisateur, décisions prises et leur raison.
5. Technologies (cliquables vers la page Compétences).
6. Galerie (captures annotées, graphiques).
7. Difficultés et apprentissages.
8. Liens : GitHub, démo, documentation, rapport.

### 4.2 Les trois badges

| Badge | Valeurs |
| --- | --- |
| Code | Public · Privé · Confidentiel (client) |
| État | Terminé · En cours · Prototype |
| Démo | Le niveau le plus élevé disponible sur l'échelle ci-dessous |

### 4.3 L'échelle de preuves

Un projet peut cumuler plusieurs niveaux ; la fiche propose le plus interactif en bouton principal et les autres en onglets.

| Niveau | Format | Serveur requis | Usage type |
| --- | --- | --- | --- |
| 1 | Captures annotées + schémas | Non | Tous les projets |
| 2 | Vidéo de 60 à 90 s, sous-titrée | Non | Mobile, desktop, projets clients |
| 3 | Visite guidée interactive | Non | Applications non déployées |
| 4 | Notebook publié en HTML (avec sorties et graphiques) | Non | Projets Data |
| 5 | Playground de modèle (saisie → prédiction) | Oui, gratuit | Projets ML / NLP |
| 6 | Bac à sable en direct, connexion en un clic | Oui | Applications full stack déployées |

### 4.4 Visite guidée interactive (niveau 3)

La visite est construite dans l'admin, sans outil externe :

1. Ayem importe les captures dans l'ordre du parcours.
2. Sur chaque capture, elle trace une zone cliquable (coordonnées en % de l'image, donc compatibles mobile) et écrit une légende.
3. Elle choisit un cadre : navigateur, téléphone ou aucun.
4. Le visiteur clique sur la zone mise en évidence pour passer à l'écran suivant ; barre de progression, boutons Précédent / Suivant, navigation au clavier.

### 4.5 Bac à sable avec connexion en un clic (niveau 6)

Le bac à sable appartient au projet présenté (par exemple l'API de KÔVO), pas au portfolio. Le portfolio stocke seulement sa configuration : rôles proposés et adresse de connexion de démo.

Ce que chaque projet déployable doit prévoir :

- une base de démo séparée, remplie de données fictives réalistes (noms ivoiriens, montants en FCFA) générées par un script ;
- une route `/demo/login?role=...` qui renvoie un jeton valable 1 heure pour le compte de démo du rôle ;
- une remise à zéro automatique de la base chaque nuit ;
- e-mails, SMS et paiements simulés ;
- un bandeau « Mode démo — données fictives » ;
- une limite de requêtes sur les routes de démo.

Sur la fiche, le visiteur voit un bouton par rôle, par exemple « Explorer en tant que passager ». Si le serveur du projet est en veille, un message « Démarrage de la démo (environ 30 s) » s'affiche et la visite guidée reste proposée en attendant.

### 4.6 Accès sur demande (projets confidentiels)

Pour un projet client, le visiteur peut demander l'accès (nom, entreprise, e-mail, motif). Ayem accepte ou refuse dans l'admin. Le visiteur reçoit alors un code valable 7 jours, et les consultations sont enregistrées.

### 4.7 Format conseillé par projet

| Projet | Code | Démo proposée |
| --- | --- | --- |
| TelcomCI (prédiction des départs RH) | Public | Notebook + playground « profil employé → risque de départ » |
| CinéScope (critiques de films, NLP) | Public | Notebook + playground « critique → sentiment » |
| KÔVO (covoiturage) | En attente d'autorisation | Gardé en brouillon dans l'admin, non visible tant que l'autorisation n'est pas donnée. Ensuite : visite guidée en cadre téléphone + vidéo, puis bac à sable une fois l'API déployée |
| BanqueCI (comparateur bancaire) | Confidentiel | Étude de cas anonymisée + visite guidée sur données fictives + accès sur demande, uniquement avec accord écrit du client |
| NepalusVote (JavaFX) | Public | Vidéo + fichier `.jar` téléchargeable |
| DiabetesGuard AI | À décider | Notebook + captures du tableau de bord Power BI |
| Portfolio lui-même | Public | Visite guidée de l'admin (il prouve le profil Full Stack) |

## 5. Panneau d'administration (CMS)

L'admin permet d'ajouter, modifier et publier tout le contenu sans toucher au code ; il est accessible sur `/admin`, avec un seul compte administrateur.

| Module | Fonctions |
| --- | --- |
| Connexion | E-mail + mot de passe, déconnexion, suivi des connexions |
| Tableau de bord | Vues par projet, démos lancées, métier choisi par les visiteurs, derniers messages et demandes |
| Projets | Créer, modifier, brouillon, prévisualiser, publier, archiver, ordonner, marquer « phare », historique des versions |
| Démos | Ajouter vidéo, notebook, lien playground, configuration du bac à sable (rôles + adresse) |
| Visites guidées | Importer les captures, tracer les zones, écrire les légendes, choisir le cadre |
| Compétences | Domaines, niveaux, ordre d'affichage |
| Parcours | Formations, stage, certifications, hackathons, avec justificatif |
| Profil | Présentation, coordonnées, CV |
| Médias | Bibliothèque d'images, vidéos, PDF (CV, attestations) |
| Messages | Lire les messages du formulaire de contact, marquer comme traité |
| Demandes d'accès | Accepter / refuser, codes temporaires, révoquer, journal des consultations |
| Traductions | Champs français / anglais côte à côte dans chaque formulaire |
| Publication | Bouton « Mettre le site à jour » qui régénère les pages publiques |

Tout le contenu du site se gère dans l'admin ; aucun texte n'est écrit en dur dans le code.

## 6. Stack technique

La stack reprend les choix déjà faits (React + FastAPI + PostgreSQL) et y ajoute ce qu'il faut pour les démos, la publication statique et la qualité.

| Couche | Technologie | Rôle |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | Site public et admin dans un même dépôt |
| Routage | React Router | Séparation public / `/admin` |
| Style | Tailwind CSS | Palette corail/orange, responsive |
| Données côté client | TanStack Query | Appels à l'API depuis l'admin, cache |
| Formulaires | React Hook Form + Zod | Formulaires de l'admin et validation |
| Animations | Framer Motion (avec modération) | Transitions de la visite guidée |
| Traduction | react-i18next | Français / anglais |
| Backend | FastAPI + Pydantic v2 | API REST |
| Accès base | SQLAlchemy 2 + Alembic | Modèles et migrations |
| Base de données | PostgreSQL (hébergé sur Supabase) | Contenu du portfolio |
| Fichiers | Supabase Storage | Images, vidéos, notebooks HTML, PDF |
| Authentification | JWT dans un cookie `httpOnly`, mots de passe hachés (Argon2 ou bcrypt) | Protéger l'admin |
| Limitation de requêtes | SlowAPI | Formulaire de contact, connexion |
| E-mails | Service transactionnel (ex. Resend) | Notification des messages et des demandes d'accès |
| Notebooks | `jupyter nbconvert --to html` | Niveau 4 de l'échelle |
| Playgrounds ML | Gradio ou Streamlit sur Hugging Face Spaces, intégrés en iframe | Niveau 5 de l'échelle |
| Vidéos | MP4/WebM compressés, ou YouTube non répertorié | Niveau 2 de l'échelle |
| Environnement local | Docker Compose (API + PostgreSQL) | Même environnement partout |
| Tests | Pytest (API), Vitest + Testing Library (frontend) | Qualité |
| Intégration continue | GitHub Actions | Tests et lint à chaque pull request |

**Publication statique.** Quand Ayem clique sur « Mettre le site à jour », l'API déclenche un nouveau build du frontend (deploy hook Vercel). Le build récupère le contenu publié, l'enregistre en fichiers JSON et pré-génère le HTML de chaque page. Le site public ne dépend donc jamais du réveil de l'API, et il est bien référencé par les moteurs de recherche.

## 7. Modèle de données

Le schéma passe de 4 tables à 15, surtout pour gérer les démos, relier compétences et projets, et tout rendre modifiable depuis l'admin. Les textes traduisibles sont stockés en JSON `{"fr": "...", "en": "..."}`.

| Table | Champs principaux |
| --- | --- |
| `admin` | id, email, mot\_de\_passe\_hash, derniere\_connexion |
| `profil` | nom, titre, presentation (fr/en), email, liens (LinkedIn, GitHub), cv\_url — une seule ligne |
| `projet` | id, slug, titre (fr/en), resume (fr/en), contenu (sections de la fiche, fr/en), categorie (personnel / académique / collaboratif), etat, acces\_code, est\_phare, ordre, statut\_publication (brouillon / publié / archivé), dates |
| `version_projet` | id, projet\_id, contenu (copie JSON du projet), date |
| `metier` | id, nom (Data Analyst, Data Engineer, Full Stack) |
| `projet_metier` | projet\_id, metier\_id, pertinence |
| `technologie` | id, nom, domaine, niveau, ordre |
| `projet_technologie` | projet\_id, technologie\_id |
| `media` | id, projet\_id (facultatif), type, url, legende (fr/en), ordre |
| `demo` | id, projet\_id, type (video / visite / notebook / playground / bac\_a\_sable / lien\_externe), url, config (JSON : rôles et adresse de connexion), est\_principale |
| `etape_visite` | id, demo\_id, ordre, image\_url, zone (x, y, largeur, hauteur en %), legende (fr/en) |
| `parcours` | id, type (formation / stage / certification / hackathon / challenge), titre, etablissement, dates, description (fr/en), justificatif\_url |
| `message` | id, nom, email, contenu, traite, date |
| `demande_acces` | id, projet\_id, nom, entreprise, email, motif, statut, code\_hash, expire\_le |
| `consultation` | id, projet\_id, demande\_id (facultatif), type\_demo, metier\_choisi, date |

La table `technologie` porte le niveau, ce qui permet d'afficher « Spark — Pratique — utilisé dans 2 projets » avec une simple jointure.

## 8. Sécurité

Aucun vrai identifiant ni aucune donnée client n'est jamais exposé publiquement.

- Admin : JWT de courte durée dans un cookie `httpOnly` + `Secure` + `SameSite`, mot de passe haché, 5 tentatives de connexion par minute au maximum.
- Secrets (base, stockage, e-mail, deploy hook) dans des variables d'environnement, jamais dans le dépôt ; un fichier `.env.example` documente les clés.
- CORS limité au domaine du portfolio.
- Fichiers importés : types et tailles contrôlés, noms régénérés.
- Formulaire de contact : limitation de requêtes + champ piège anti-robot.
- Codes d'accès stockés hachés, avec date d'expiration.
- Bacs à sable : base séparée, jetons d'1 heure, remise à zéro chaque nuit, services externes simulés.
- Projets clients : publication uniquement avec accord écrit, données anonymisées.

## 9. Hébergement et déploiement

Tout peut démarrer sur des offres gratuites ; seul l'admin subit la mise en veille du serveur, jamais le visiteur.

| Élément | Hébergeur | Remarque |
| --- | --- | --- |
| Site public + admin (frontend) | Vercel | Build déclenché par chaque push sur `main` et par le bouton « Mettre le site à jour » |
| API FastAPI | Render | Mise en veille possible sur l'offre gratuite : acceptable car seul l'admin l'utilise directement |
| Base de données + fichiers | Supabase | Les projets gratuits inactifs peuvent être mis en pause : à vérifier au moment du choix |
| Playgrounds ML | Hugging Face Spaces | Un Space par modèle |
| Bacs à sable | Hébergement propre à chaque projet | Configuré dans la fiche du projet |
| Nom de domaine | Adresse gratuite Vercel pour l'instant ; domaine personnel plus tard | Plus professionnel sur un CV |

Workflow Git : une branche par fonctionnalité, pull request vers `main`, tests GitHub Actions obligatoires avant fusion.

Les conditions des offres gratuites changent souvent ; elles sont à revérifier avant le déploiement.

### Fonctionnement en local

Toute l'application doit pouvoir tourner sur l'ordinateur d'Ayem avec une seule commande, `docker compose up`, sans créer aucun compte externe. Chaque service externe a donc un remplacement local, choisi par une variable d'environnement.

| Service en ligne | Remplacement en local |
| --- | --- |
| Supabase (PostgreSQL) | Conteneur PostgreSQL |
| Supabase Storage | Dossier local `uploads/` servi par l'API |
| Service d'e-mail | Mailpit : boîte de réception de test visible dans le navigateur |
| Deploy hook Vercel | Commande locale qui regénère les pages publiques |
| Playgrounds Hugging Face | Lien désactivé ou application Gradio lancée en local |

Au premier lancement, un script crée le compte admin et du contenu d'exemple en brouillon. Le README indique les adresses à ouvrir : site public, admin, documentation de l'API, Mailpit.

## 10. Plan de construction

L'agent livre la version finale complète en une seule mission, découpée en 6 lots ; chaque lot se termine par des tests qui passent et une pull request.

| Lot | Contenu | Terminé quand |
| --- | --- | --- |
| 1. Fondations | Dépôt, Docker Compose, CI GitHub Actions, base de données (15 tables) et migrations | `docker compose up` lance l'API et la base ; la CI passe |
| 2. API | Authentification, CRUD de tous les modules, upload des médias, demandes d'accès, statistiques, historique | Tests Pytest verts sur chaque route |
| 3. Admin | Tous les modules de la section 5, dont l'éditeur de visite guidée et les champs FR/EN | Un projet complet peut être créé, prévisualisé et publié sans toucher au code |
| 4. Site public | 5 pages, entrée par métier, fiche projet, lecteur de démos (vidéo, visite, notebook, playground, bac à sable), accès sur demande, FR/EN | Parcours complet testé sur mobile et ordinateur |
| 5. Publication | Génération statique des pages publiques, deploy hook, référencement (titres, aperçus de partage, sitemap) | Le site s'affiche avec l'API arrêtée |
| 6. Livraison | Contenu d'exemple en brouillon, README, guide de déploiement pas à pas, guide d'utilisation de l'admin | Ayem peut déployer et remplir le site seule |

**Ce que l'agent ne peut pas faire à la place d'Ayem :**

- créer les comptes (Vercel, Render, Supabase, Hugging Face, service d'e-mail) et y saisir les clés secrètes ;
- fournir le vrai contenu : textes des projets, captures, vidéos, CV, justificatifs ;
- entraîner les modèles des playgrounds (il peut écrire l'application Gradio si on lui donne le modèle) ;
- obtenir les autorisations de BanqueCI et KÔVO.

## 11. Points à confirmer

Les choix de conception sont validés ; il reste deux informations à fournir, qui ne bloquent pas la construction du site.

**Décisions validées**

| Sujet | Décision |
| --- | --- |
| Navigation des projets | Entrée par métier en tête, filtres par domaine en dessous |
| Visite guidée | Construite dans l'admin ; un lien Arcade/Supademo reste accepté comme démo de secours |
| Messages de contact | Stockés en base + notification par e-mail |
| Thème | Sombre seul, sections claires en alternance ; couleurs en variables pour ajouter un thème clair plus tard |
| Adresse du site | Adresse gratuite Vercel pour l'instant ; domaine personnel plus tard |
| Exécution | Toute l'application doit tourner en local, sans aucun compte externe (section 9) |
| Projet phare Full Stack | BanqueCI, une fois l'autorisation obtenue (à la place de KÔVO) |

**Encore à fournir par Ayem**

- [ ] Autorisation écrite pour BanqueCI (présentation anonymisée) et pour KÔVO (publication dans le portfolio).
- [ ] Liste des projets à publier, et les projets phares Data Analyst et Data Engineer.
