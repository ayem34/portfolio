import { EMPTY_TEXT } from '../lib/localized';
import type { ContenuProjet, Projet, ProjetInput } from '../lib/types';

export const EMPTY_CONTENT: ContenuProjet = {
  infos: { periode: EMPTY_TEXT, role: EMPTY_TEXT, equipe: EMPTY_TEXT, cadre: EMPTY_TEXT },
  contexte: EMPTY_TEXT,
  objectifs: EMPTY_TEXT,
  resultats: EMPTY_TEXT,
  chiffres: [],
  methode: {
    regles_metier: EMPTY_TEXT,
    architecture: EMPTY_TEXT,
    modele_donnees: EMPTY_TEXT,
    parcours_utilisateur: EMPTY_TEXT,
    decisions: EMPTY_TEXT,
  },
  difficultes: EMPTY_TEXT,
  apprentissages: EMPTY_TEXT,
  liens: { github: '', demo: '', documentation: '', rapport: '' },
};

export const EMPTY_PROJECT: ProjetInput = {
  slug: '',
  titre: EMPTY_TEXT,
  resume: EMPTY_TEXT,
  contenu: EMPTY_CONTENT,
  categorie: 'personnel',
  etat: 'en_cours',
  acces_code: 'public',
  est_phare: false,
  metiers: [],
  technologie_ids: [],
};

/** Partie modifiable d'un projet (ce que l'API attend en écriture). */
export function toProjectInput(projet: Projet): ProjetInput {
  const { slug, titre, resume, contenu, categorie, etat, acces_code, est_phare } = projet;
  return {
    slug,
    titre,
    resume,
    contenu,
    categorie,
    etat,
    acces_code,
    est_phare,
    metiers: projet.metiers,
    technologie_ids: projet.technologie_ids,
  };
}

/** « Prédiction des départs RH » → « prediction-des-departs-rh ». */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
