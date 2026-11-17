/**
 * Lecture du contenu publié. Le site ne lit que des fichiers JSON générés à la
 * publication (/data/...), jamais l'API : il s'affiche donc même si elle est en veille.
 */

import { type QueryClient, useQuery } from '@tanstack/react-query';

import type { PublicProjetDetail, PublicSite } from './types';

export class NotFoundError extends Error {}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const isJson = response.headers.get('content-type')?.includes('json');
  // Un hébergeur statique peut répondre par la page 404 en HTML : c'est aussi « introuvable ».
  if (response.status === 404 || (response.ok && !isJson)) throw new NotFoundError(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

export const SITE_KEY = ['site'] as const;
export const projectKey = (slug: string) => ['projet', slug] as const;

export const siteUrl = () => '/data/site.json';
export const projectUrl = (slug: string) => `/data/projets/${encodeURIComponent(slug)}.json`;

export function useSite() {
  return useQuery({
    queryKey: SITE_KEY,
    queryFn: () => fetchJson<PublicSite>(siteUrl()),
    staleTime: Infinity,
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: projectKey(slug),
    queryFn: () => fetchJson<PublicProjetDetail>(projectUrl(slug)),
    staleTime: Infinity,
  });
}

/** Contenu fourni avec la page pré-générée (ou par le script de pré-rendu). */
export interface InitialContent {
  site: PublicSite;
  projet?: PublicProjetDetail;
  /** Page 404 générique : elle est servie pour n'importe quelle adresse inconnue. */
  notFound?: boolean;
}

export function seedContent(queryClient: QueryClient, content: InitialContent): void {
  queryClient.setQueryData(SITE_KEY, content.site);
  if (content.projet) queryClient.setQueryData(projectKey(content.projet.slug), content.projet);
}
