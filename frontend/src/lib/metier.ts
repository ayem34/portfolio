import { useCallback, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { PublicProjetCard, PublicTechnologie } from './types';

export const METIER_PARAM = 'metier';

const subscribe = () => () => {};

/** Faux pendant le pré-rendu et l'hydratation, vrai ensuite (évite un écart avec le HTML généré). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * Métier choisi par le visiteur, mémorisé dans l'URL (?metier=data-engineer) :
 * Ayem peut ainsi envoyer un lien ciblé à chaque recruteur.
 */
export function useMetier(): [string | null, (slug: string | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const hydrated = useHydrated();
  const metier = hydrated ? searchParams.get(METIER_PARAM) : null;
  const setMetier = useCallback(
    (slug: string | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (slug) next.set(METIER_PARAM, slug);
          else next.delete(METIER_PARAM);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setSearchParams],
  );
  return [metier, setMetier];
}

/** Ajoute le métier choisi à un lien interne, pour le garder d'une page à l'autre. */
export function withMetier(path: string, metier: string | null): string {
  if (!metier) return path;
  const [base = '', hash] = path.split('#');
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}${METIER_PARAM}=${encodeURIComponent(metier)}${hash ? `#${hash}` : ''}`;
}

function relevance(projet: PublicProjetCard, metier: string): number {
  return projet.metiers.find((link) => link.slug === metier)?.pertinence ?? 0;
}

/** Projets du métier choisi d'abord (du plus pertinent au moins pertinent), puis les autres. */
export function sortProjects<T extends PublicProjetCard>(projets: T[], metier: string | null): T[] {
  if (!metier) return projets;
  // Le tri est stable : à pertinence égale, l'ordre défini dans l'admin est conservé.
  return [...projets].sort((a, b) => relevance(b, metier) - relevance(a, metier));
}

/** Compétences utilisées par les projets du métier choisi d'abord (Q5 de docs/questions.md). */
export function sortTechnologies(
  technologies: PublicTechnologie[],
  projets: PublicProjetCard[],
  metier: string | null,
): PublicTechnologie[] {
  if (!metier) return technologies;
  const relevantSlugs = new Set(
    projets.filter((projet) => relevance(projet, metier) > 0).map((projet) => projet.slug),
  );
  const isRelevant = (technologie: PublicTechnologie) =>
    technologie.projets.some((slug) => relevantSlugs.has(slug));
  return [...technologies].sort((a, b) => Number(isRelevant(b)) - Number(isRelevant(a)));
}
