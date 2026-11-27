# Questions et choix faits pendant la construction

Chaque entrée indique ce qui manquait dans `docs/conception.md`, l'option retenue (la plus simple et la plus réversible) et comment la changer. Rien ici ne bloque la construction.

## Q1 — Que contient `projet.acces_code` ?

La section 7 liste `etat` et `acces_code` sans détailler. La section 4.2 définit un badge **Code** (Public · Privé · Confidentiel) qui n'a pas d'autre champ possible.

**Choix :** `acces_code` = accès au code source : `public`, `prive`, `confidentiel`. Un projet `confidentiel` est celui pour lequel l'accès sur demande (section 4.6) s'applique : sa fiche publique ne montre que l'en-tête, le reste demande un code.

**Pour changer :** ajouter un champ booléen séparé si l'on veut un projet confidentiel sans accès sur demande.

## Q2 — Valeurs avec accents dans la base

**Choix :** les valeurs techniques sont stockées sans accent (`academique`, `publie`, `archive`, `termine`, `bac_a_sable`). Le texte affiché (« Académique », « Publié »…) vient des fichiers de traduction.

## Q3 — Champs ajoutés aux tables de la section 7

La section 7 donne les « champs principaux ». Ajouts nécessaires, tous en français snake_case :

| Table | Ajout | Raison |
| --- | --- | --- |
| `metier` | `slug`, `ordre` ; `nom` en JSON fr/en | `?metier=data-engineer` dans l'URL ; « Développeuse Full Stack » se traduit |
| `projet` | `date_creation`, `date_modification`, `date_publication` | détail de « dates » |
| `technologie` | `domaine` en JSON fr/en | le nom du domaine s'affiche et se traduit |
| `media` | `nom`, `taille`, `date` | retrouver un fichier dans la bibliothèque |
| `demo` | `ordre` | ordre des onglets à niveau égal |
| `parcours` | `date_debut`, `date_fin` ; `titre` en JSON fr/en | détail de « dates » |
| `demande_acces` | `date`, `date_decision` | tri et suivi |

## Q4 — Où ranger le positionnement, l'orientation et « Comment je travaille » du profil ?

La table `profil` n'a qu'un champ `presentation (fr/en)`, alors que l'accueil demande un positionnement en 2 phrases et la page À propos trois rubriques.

**Choix :** `profil.presentation` est un JSON à sections, sur le modèle de `projet.contenu` : `accroche`, `profil`, `orientation`, `methode`, chacune en fr/en. `profil.titre` est aussi en fr/en.

## Q5 — Quelles compétences sont « pertinentes » pour un métier ?

**Choix :** une compétence est pertinente pour un métier si elle est utilisée par au moins un projet publié rattaché à ce métier. Elle remonte alors en tête de la page Compétences. Aucune table supplémentaire ; cohérent avec « prouver plutôt qu'affirmer ».

## Q6 — Statistique « métier choisi par les visiteurs »

La table `consultation` exige un `projet_id`. **Choix :** le métier choisi est enregistré avec chaque vue de fiche et chaque lancement de démo. Le choix d'un métier sans ouvrir de projet n'est donc pas compté.

## Q7 — Pages en anglais et référencement

**Choix :** les pages sont pré-générées en français. Le bouton FR/EN change la langue dans le navigateur et le choix est mémorisé. Les moteurs de recherche indexent donc la version française.

**Proposition (non réalisée, absente de la conception) :** générer aussi des pages `/en/...` pour le référencement anglophone.

## Q8 — Cookie de l'admin entre Vercel et Render

Le site (Vercel) et l'API (Render) sont sur deux domaines différents ; un cookie `SameSite` strict n'y passerait pas et les navigateurs bloquent de plus en plus les cookies tiers.

**Choix :** `frontend/vercel.json` réécrit `/api/*` vers l'API. Pour le navigateur, tout vient du même domaine : cookie `httpOnly` + `Secure` + `SameSite=Lax`, sans exception. Conséquence : Ayem doit écrire l'adresse de son API Render dans `frontend/vercel.json` (une ligne, expliquée dans le guide de déploiement). Cette adresse n'est pas un secret.

## Q9 — Comment se fait la « connexion en un clic » du bac à sable ?

La conception dit que la route `/demo/login?role=...` du projet présenté « renvoie un jeton ». **Choix :** le bouton « Explorer en tant que… » ouvre cette adresse dans un nouvel onglet ; c'est le projet présenté qui pose sa session et redirige vers son interface. Le portfolio ne manipule aucun jeton. Avant d'activer les boutons, le portfolio « réveille » le serveur du projet et affiche « Démarrage de la démo (environ 30 s) ».

## Q10 — Format des textes longs

**Choix :** Markdown (titres, listes, gras, liens, images de la bibliothèque), sans HTML brut. Les schémas d'architecture et modèles de données sont des images insérées dans le texte.

## Q11 — Commits « Verified »

Les commits sont signés (clé SSH) dans l'environnement de l'agent. À vérifier sur GitHub après le premier push : si le badge « Verified » n'apparaît pas, c'est que la clé de signature n'est pas reconnue par le compte GitHub.

## Q12 — Fichiers téléchargeables (`.jar` de NepalusVote)

L'import de fichiers est limité aux images, vidéos, PDF, notebooks HTML et sous-titres. **Choix :** un `.jar` se publie comme démo « lien externe » pointant vers une release GitHub, ce qui évite d'héberger un exécutable.

## Q13 — Textes de la méthode en 4 étapes (page À propos)

La règle « aucun texte écrit en dur » demande que le contenu vienne de la base. Les 4 étapes « Comprendre → Concevoir → Construire → Livrer » et leur « Vous recevez » décrivent la façon de travailler du site, pas un contenu qui change souvent. **Choix :** elles sont dans les fichiers de traduction (`about.method.steps`), en FR et EN. Si Ayem veut les modifier sans toucher au code, on pourra les déplacer dans le profil (même principe que « Comment je travaille »).

## Q14 — Chiffres clés et couleurs des domaines

**Choix :** les chiffres affichés (projets publiés, compétences prouvées, challenges et hackathons, métiers) sont toujours **calculés** à partir du contenu publié, jamais saisis : ils ne peuvent pas contredire la page Projets. Sur la page Compétences, chaque domaine reçoit automatiquement une couleur parmi huit teintes, dans l'ordre d'apparition.
