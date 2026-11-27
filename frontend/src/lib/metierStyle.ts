import type { CouleurMetier } from './types';

/** Classe CSS qui donne au bloc la couleur du métier (variables --m, --m-2, --m-soft). */
export const metierClass = (couleur: CouleurMetier | undefined) => `metier-${couleur ?? 'corail'}`;

/** Couleur « trait » d'un métier sur fond sombre (radar, légendes). */
export const METIER_HEX: Record<CouleurMetier, string> = {
  corail: '#ff7a59',
  bleu: '#4f9df0',
  vert: '#3fbf7f',
  ambre: '#f0b43c',
  violet: '#a98bff',
};
