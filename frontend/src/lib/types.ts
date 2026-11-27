/** Types des données échangées avec l'API (mêmes noms de champs que la base). */

export interface LocalizedText {
  fr: string;
  en: string;
}

export type Categorie = 'personnel' | 'academique' | 'collaboratif';
export type Etat = 'termine' | 'en_cours' | 'prototype';
export type AccesCode = 'public' | 'prive' | 'confidentiel';
export type StatutPublication = 'brouillon' | 'publie' | 'archive';
export type Niveau = 'notions' | 'pratique' | 'bonne_maitrise';
export type TypeMedia = 'image' | 'video' | 'pdf' | 'notebook' | 'sous_titres';
export type TypeDemo =
  'video' | 'visite' | 'notebook' | 'playground' | 'bac_a_sable' | 'lien_externe';
export type TypeParcours = 'formation' | 'stage' | 'certification' | 'hackathon' | 'challenge';
export type StatutDemande = 'en_attente' | 'acceptee' | 'refusee' | 'revoquee';
export type Cadre = 'navigateur' | 'telephone' | 'aucun';
export type ObjetMessage = 'projet' | 'stage' | 'emploi' | 'autre';
export type FigureMetier = 'graphique' | 'pipeline' | 'application';
export type CouleurMetier = 'corail' | 'bleu' | 'vert' | 'ambre' | 'violet';

export const CATEGORIES: Categorie[] = ['personnel', 'academique', 'collaboratif'];
export const ETATS: Etat[] = ['termine', 'en_cours', 'prototype'];
export const ACCES_CODES: AccesCode[] = ['public', 'prive', 'confidentiel'];
export const NIVEAUX: Niveau[] = ['notions', 'pratique', 'bonne_maitrise'];
export const TYPES_DEMO: TypeDemo[] = [
  'bac_a_sable',
  'playground',
  'notebook',
  'visite',
  'video',
  'lien_externe',
];
export const TYPES_PARCOURS: TypeParcours[] = [
  'formation',
  'stage',
  'certification',
  'hackathon',
  'challenge',
];
export const CADRES: Cadre[] = ['navigateur', 'telephone', 'aucun'];
export const OBJETS_MESSAGE: ObjetMessage[] = ['projet', 'stage', 'emploi', 'autre'];
export const FIGURES_METIER: FigureMetier[] = ['graphique', 'pipeline', 'application'];
export const COULEURS_METIER: CouleurMetier[] = ['corail', 'bleu', 'vert', 'ambre', 'violet'];

// --- Projet ---

export interface Chiffre {
  valeur: string;
  libelle: LocalizedText;
}

export const METHODE_KEYS = [
  'regles_metier',
  'architecture',
  'modele_donnees',
  'parcours_utilisateur',
  'decisions',
] as const;
export type MethodeKey = (typeof METHODE_KEYS)[number];

export const LIEN_KEYS = ['github', 'demo', 'documentation', 'rapport'] as const;
export type LienKey = (typeof LIEN_KEYS)[number];

export const INFO_KEYS = ['periode', 'role', 'equipe', 'cadre'] as const;
export type InfoKey = (typeof INFO_KEYS)[number];

export interface ContenuProjet {
  infos: Record<InfoKey, LocalizedText>;
  contexte: LocalizedText;
  objectifs: LocalizedText;
  resultats: LocalizedText;
  chiffres: Chiffre[];
  methode: Record<MethodeKey, LocalizedText>;
  difficultes: LocalizedText;
  apprentissages: LocalizedText;
  liens: Record<LienKey, string>;
}

export interface ProjetMetierLink {
  metier_id: number;
  pertinence: number;
}

export interface ProjetInput {
  slug: string;
  titre: LocalizedText;
  resume: LocalizedText;
  contenu: ContenuProjet;
  categorie: Categorie;
  etat: Etat;
  acces_code: AccesCode;
  est_phare: boolean;
  metiers: ProjetMetierLink[];
  technologie_ids: number[];
}

export interface Projet extends ProjetInput {
  id: number;
  ordre: number;
  statut_publication: StatutPublication;
  date_creation: string;
  date_modification: string;
  date_publication: string | null;
}

export interface VersionProjet {
  id: number;
  date: string;
  contenu: ProjetInput;
}

// --- Démos ---

export interface Zone {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

export interface EtapeInput {
  image_url: string;
  zone: Zone | null;
  legende: LocalizedText;
}

export interface Etape extends EtapeInput {
  id: number;
  ordre: number;
}

export interface RoleBacASable {
  cle: string;
  libelle: LocalizedText;
}

export interface DemoConfig {
  titre: LocalizedText;
  cadre: Cadre;
  adresse_connexion: string;
  roles: RoleBacASable[];
  sous_titres: LocalizedText;
}

export interface DemoInput {
  type: TypeDemo;
  url: string;
  config: DemoConfig;
  est_principale: boolean;
}

export interface Demo extends DemoInput {
  id: number;
  projet_id: number;
  ordre: number;
  etapes: Etape[];
}

// --- Autres contenus ---

export interface OffreMetier {
  titre: LocalizedText;
  texte: LocalizedText;
}

export interface MetierInput {
  nom: LocalizedText;
  description: LocalizedText;
  offre: OffreMetier;
  figure: FigureMetier;
  couleur: CouleurMetier;
}

export interface Metier extends MetierInput {
  id: number;
  slug: string;
}

export interface TechnologieInput {
  nom: string;
  domaine: LocalizedText;
  niveau: Niveau;
  source: LocalizedText;
  /** 1 = cours suivi, 2 = exercices faits, 3 = projet prévu. */
  progression: number;
}

export interface Technologie extends TechnologieInput {
  id: number;
  ordre: number;
  nb_projets: number;
}

export interface ParcoursInput {
  type: TypeParcours;
  titre: LocalizedText;
  etablissement: string;
  date_debut: string;
  date_fin: string | null;
  description: LocalizedText;
  justificatif_url: string | null;
}

export interface Parcours extends ParcoursInput {
  id: number;
}

export const PRESENTATION_KEYS = [
  'accroche',
  'profil',
  'orientation',
  'methode',
  'slogan',
  'disponibilite',
  'localisation',
] as const;
export type PresentationKey = (typeof PRESENTATION_KEYS)[number];

export interface Profil {
  nom: string;
  titre: LocalizedText;
  presentation: Record<PresentationKey, LocalizedText>;
  email: string;
  liens: { linkedin: string; github: string };
  cv_url: string | null;
}

export interface Media {
  id: number;
  projet_id: number | null;
  type: TypeMedia;
  url: string;
  legende: LocalizedText;
  ordre: number;
  nom: string;
  taille: number;
  date: string;
}

export interface Message {
  id: number;
  objet: ObjetMessage;
  nom: string;
  entreprise: string;
  email: string;
  contenu: string;
  traite: boolean;
  date: string;
}

export interface DemandeAcces {
  id: number;
  projet_id: number;
  projet_slug: string;
  projet_titre: LocalizedText;
  nom: string;
  entreprise: string;
  email: string;
  motif: string;
  statut: StatutDemande;
  expire_le: string | null;
  date: string;
  date_decision: string | null;
  nb_consultations: number;
}

export interface Consultation {
  id: number;
  type_demo: string | null;
  metier_choisi: string | null;
  date: string;
}

export interface AdminSession {
  email: string;
  derniere_connexion: string | null;
}

export interface StatCompteur {
  cle: string;
  total: number;
}

export interface Statistiques {
  jours: number;
  total_vues: number;
  total_demos_lancees: number;
  vues_par_projet: {
    projet_id: number;
    slug: string;
    titre: LocalizedText;
    vues: number;
    demos_lancees: number;
  }[];
  demos_lancees: StatCompteur[];
  metiers_choisis: StatCompteur[];
  messages_non_traites: number;
  demandes_en_attente: number;
  derniers_messages: Message[];
  dernieres_demandes: DemandeAcces[];
}

// --- Contenu publié (site public, aperçu admin) ---

export interface PublicMetier {
  slug: string;
  nom: LocalizedText;
}

export interface PublicMetierDetail extends PublicMetier {
  description: LocalizedText;
  offre: OffreMetier;
  figure: FigureMetier;
  couleur: CouleurMetier;
}

export interface PublicTechnologie {
  id: number;
  nom: string;
  domaine: LocalizedText;
  niveau: Niveau;
  source: LocalizedText;
  progression: number;
  projets: string[];
}

export interface PublicProjetCard {
  slug: string;
  titre: LocalizedText;
  resume: LocalizedText;
  categorie: Categorie;
  etat: Etat;
  acces_code: AccesCode;
  est_phare: boolean;
  metiers: (PublicMetier & { pertinence: number })[];
  technologies: number[];
  types_demo: TypeDemo[];
  niveau_demo: number;
  image: string | null;
  date_publication: string | null;
}

export interface PublicMedia {
  id: number;
  type: TypeMedia;
  url: string;
  legende: LocalizedText;
}

export interface PublicDemo {
  id: number;
  type: TypeDemo;
  url: string;
  config: DemoConfig;
  etapes: Etape[];
}

export interface PublicProjetDetail extends PublicProjetCard {
  protege: boolean;
  contenu: ContenuProjet | null;
  technologies_detail: PublicTechnologie[];
  galerie: PublicMedia[];
  demos: PublicDemo[];
}

export interface PublicSite {
  profil: Profil;
  metiers: PublicMetierDetail[];
  projets: PublicProjetCard[];
  technologies: PublicTechnologie[];
  parcours: Parcours[];
  genere_le: string;
}
