# Guide d'utilisation de l'admin

L'admin est à l'adresse `/admin` du site (en local : http://localhost:5173/admin). Il n'apparaît dans aucun menu public.

Trois principes à retenir :

1. **Un brouillon n'est jamais visible.** Seuls les projets au statut « Publié » peuvent apparaître sur le site.
2. **Publier ne suffit pas : il faut « Mettre le site à jour ».** Le site public est fait de pages générées à l'avance. Après toute modification visible (projet, profil, compétence, parcours), aller dans **Publication** et cliquer sur **Mettre le site à jour**. Les changements arrivent une à deux minutes plus tard.
3. **Chaque texte existe en français et en anglais**, côte à côte. Si l'anglais est vide, le site affiche le français.

Au premier lancement, trois projets « Exemple — … » sont présents en brouillon. Ouvrez-les pour voir comment une fiche, une visite guidée ou un bac à sable sont remplis, puis supprimez-les.

## 1. Avant le premier projet

| Menu | À faire |
| --- | --- |
| **Profil** | Nom, titre, e-mail, LinkedIn, GitHub, CV (PDF). « Positionnement » = les deux phrases de l'accueil ; « Profil », « Orientation » et « Comment je travaille » alimentent la page À propos |
| **Compétences** | Créer chaque compétence avec son domaine (ex. « Big Data ») et son niveau (Notions / Pratique / Bonne maîtrise). Les flèches ↑ ↓ règlent l'ordre d'affichage |
| **Parcours** | Formations, stage, certifications, hackathons, challenges, avec un justificatif (PDF ou image) si vous en avez un |

Les textes longs acceptent le Markdown : `**gras**`, listes avec `- `, titres avec `## `, liens `[texte](https://…)`.

## 2. Ajouter un projet

1. **Projets → Nouveau projet.**
2. Onglet **Général** :
   - **Titre** (le français est obligatoire). L'adresse de la fiche (« slug ») se remplit toute seule ; vous pouvez la raccourcir. Évitez de la changer après publication : les liens déjà partagés ne fonctionneraient plus.
   - **Résumé d'une phrase** : affiché sur la carte du projet.
   - **Catégorie**, et les deux badges **État** (Terminé / En cours / Prototype) et **Code** (Public / Privé / Confidentiel). Le troisième badge, **Démo**, se calcule tout seul d'après les démos ajoutées.
   - **Projet phare** : affiché sur l'accueil (3 au maximum y sont montrés).
   - **Métiers concernés** : cochez les métiers et réglez la pertinence. Quand un recruteur choisit « Data Engineer », les projets à forte pertinence pour ce métier passent en tête.
   - **Technologies** : cochez les compétences utilisées. C'est ce qui fait apparaître « utilisée dans 2 projets » sur la page Compétences.
3. **Enregistrer.** Les onglets Galerie, Démos et Historique deviennent disponibles.
4. Onglet **Contenu de la fiche** : contexte, objectifs, résultats, résultats chiffrés (ex. valeur `0,87`, libellé `Score F1`), « Comment je travaille » (5 rubriques), difficultés, apprentissages, liens. Une rubrique laissée vide n'est pas affichée. **Enregistrer.**
5. Onglet **Galerie** : importez les captures et graphiques, écrivez une légende pour chacun, ordonnez avec ↑ ↓. La première image sert d'illustration à la carte du projet et aux aperçus de partage.
6. Onglet **Démos** : voir les sections 3 et 4.
7. **Prévisualiser** (en haut) : la fiche exactement comme la verra un visiteur, même en brouillon.

Pour insérer un schéma dans un texte : menu **Médias**, importez l'image, cliquez sur **Copier pour un texte**, puis collez dans la rubrique voulue.

**Historique.** Chaque enregistrement garde une copie de l'état précédent (titre, contenu, badges, métiers, technologies). Onglet Historique → **Restaurer cette version** pour revenir en arrière. La galerie et les démos ne font pas partie de l'historique.

## 3. Ajouter des démos

Onglet **Démos** du projet → choisir un type → **Ajouter la démo**, puis remplir et **Enregistrer**.

| Type | Quoi fournir |
| --- | --- |
| Visite guidée | Le cadre, puis l'éditeur de visite (section 4) |
| Vidéo | Un fichier MP4/WebM (50 Mo au plus) ou un lien YouTube non répertorié. Sous-titres : deux fichiers `.vtt` (français, anglais) |
| Notebook | Le fichier `.html` obtenu avec `jupyter nbconvert --to html mon-notebook.ipynb` |
| Playground | L'adresse du Space Hugging Face (ex. `https://nom-espace.hf.space`). Tant qu'elle est vide, la fiche affiche « indisponible » |
| Bac à sable | Voir section 5 |
| Lien externe | Une adresse complète : démo Arcade/Supademo de secours, release GitHub d'un `.jar`… |

La fiche met en avant la démo la plus interactive (bac à sable > playground > notebook > visite > vidéo) et range les autres en onglets. Pour en imposer une autre, cochez **Démo principale**.

## 4. Créer une visite guidée

1. Préparez les captures d'écran du parcours. Nommez-les dans l'ordre (`01-accueil.png`, `02-recherche.png`…) : elles deviendront les étapes dans cet ordre.
2. Onglet **Démos** → ajoutez une « Visite guidée » → **Ouvrir l'éditeur de visite**.
3. **Importer des captures** → sélectionnez tous les fichiers d'un coup. Une étape est créée par image.
4. Choisissez le **cadre** : Navigateur, Téléphone ou Aucun cadre.
5. Pour chaque étape (cliquez dessus dans la liste de gauche) :
   - **tracez un rectangle à la souris** sur la capture, autour de l'élément que le visiteur doit cliquer. Les quatre nombres sous l'image (en % de l'image) permettent d'ajuster au clavier ;
   - écrivez la **légende** en français et en anglais (« Touchez Rechercher pour lancer la recherche ») ;
   - **Enregistrer l'étape.**
6. Dernière étape : pas de zone (**Effacer la zone**). Le visiteur termine avec le bouton « Recommencer ».
7. Réordonnez avec ↑ ↓ si besoin, puis **Prévisualiser** : cliquez sur la zone mise en évidence pour vérifier l'enchaînement.

Comme les zones sont en pourcentage de l'image, la visite fonctionne à l'identique sur téléphone.

## 5. Configurer un bac à sable

Le bac à sable appartient **au projet présenté** (par exemple l'API de KÔVO), pas au portfolio. Le portfolio n'enregistre que sa configuration.

Ce que le projet présenté doit fournir (section 4.5 de la conception) : une base de démo séparée avec des données fictives, une route `/demo/login?role=…` qui ouvre une session de démo d'une heure et redirige vers l'application, une remise à zéro chaque nuit, des e-mails / SMS / paiements simulés, un bandeau « Mode démo — données fictives », une limite de requêtes.

Dans le portfolio, onglet **Démos** → ajouter un « Bac à sable » :

| Champ | Exemple | Rôle |
| --- | --- | --- |
| Adresse | `https://demo.mon-projet.com` | Sert à « réveiller » le serveur du projet dès l'ouverture de la fiche |
| Adresse de connexion de démo | `https://demo.mon-projet.com/demo/login` | Le portfolio y ajoute `?role=clé` |
| Rôles | clé `passager`, nom affiché « passager » / « a passenger » | Un bouton « Explorer en tant que passager » par rôle |

Sur la fiche, tant que le serveur ne répond pas, le visiteur voit « Démarrage de la démo (environ 30 s)… » et peut ouvrir la visite guidée en attendant — ajoutez donc toujours une visite guidée au même projet.

## 6. Projets confidentiels et demandes d'accès

Un projet dont le badge **Code** vaut **Confidentiel (client)** ne montre publiquement que son en-tête (titre, résumé, badges). Le contenu, la galerie et les démos demandent un code.

> BanqueCI et KÔVO restent en brouillon tant que l'autorisation écrite de leurs clients n'est pas obtenue.

Traiter une demande :

1. Le visiteur remplit « Demander l'accès » sur la fiche (nom, entreprise, e-mail, motif). Vous recevez un e-mail et un compteur apparaît dans le menu **Demandes d'accès**.
2. **Accepter** : un code valable 7 jours est envoyé au visiteur par e-mail. Il s'affiche aussi une seule fois à l'écran — copiez-le si vous préférez l'envoyer vous-même. **Refuser** : le visiteur est prévenu par e-mail.
3. **Journal des consultations** : chaque utilisation du code y est enregistrée, avec la date.
4. **Révoquer le code** : il cesse immédiatement de fonctionner.

## 7. Publier

1. Dans le projet (ou dans la liste), cliquez sur **Publier**. Le statut passe à « Publié ».
2. Menu **Publication → Mettre le site à jour**.
3. Après une à deux minutes, ouvrez le site et vérifiez la fiche.

Autres actions de la liste des projets : **Repasser en brouillon** (retire le projet du site à la prochaine mise à jour), **Archiver** (le garde dans l'admin sans l'afficher), ↑ ↓ (ordre d'affichage), **Supprimer** (définitif).

**Envoyer un lien ciblé à un recruteur.** Ajoutez `?metier=` à l'adresse : `…/?metier=data-analyst`, `…/?metier=data-engineer` ou `…/?metier=full-stack`. Le recruteur arrive avec les projets et compétences de ce métier en tête.

## 8. Suivi

- **Tableau de bord** : vues par projet, démos lancées, métier choisi par les visiteurs, derniers messages et demandes, sur 7, 30, 90 ou 365 jours.
- **Messages** : les messages du formulaire de contact. « Marquer comme traité » une fois la réponse envoyée.
- **Médias** : tous les fichiers importés. Un fichier encore utilisé (visite, démo, CV, justificatif) ne peut pas être supprimé : retirez-le d'abord de l'endroit où il sert.

## En cas de souci

| Ce que vous voyez | Quoi faire |
| --- | --- |
| « Connexion au serveur… » à l'ouverture de l'admin | Le serveur gratuit se réveille : patientez jusqu'à une minute |
| « Trop de tentatives » à la connexion | Attendez une minute (5 essais par minute au maximum) |
| Un changement n'apparaît pas sur le site | Le projet est-il « Publié » ? Avez-vous cliqué sur « Mettre le site à jour » ? Attendez deux minutes et rechargez |
| « Type de fichier refusé » | Formats acceptés : PNG, JPEG, WebP, GIF, MP4, WebM, PDF, HTML (notebook), VTT |
| « Cette adresse (slug) est déjà utilisée » | Un autre projet a la même adresse : changez le slug |
| Retour à la page de connexion en plein travail | La session dure une heure : reconnectez-vous |
