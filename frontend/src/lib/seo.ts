/**
 * Titre, description et image de partage de chaque page.
 * La même fonction sert au navigateur (titre de l'onglet) et au pré-rendu
 * (balises <title>, description, Open Graph).
 */

import type { TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { Language } from '../i18n';
import { localized, useLanguage } from './localized';
import type { PublicProjetDetail, PublicSite } from './types';

export interface PageMeta {
  title: string;
  description: string;
  image: string | null;
}

export type PageKey = 'home' | 'projects' | 'about' | 'skills' | 'contact' | 'notFound';

const MAX_DESCRIPTION_LENGTH = 160;

/** Texte brut d'un extrait Markdown, coupé proprement pour une description. */
export function plainExcerpt(markdown: string): string {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= MAX_DESCRIPTION_LENGTH) return text;
  return `${text.slice(0, MAX_DESCRIPTION_LENGTH - 1).replace(/\s+\S*$/, '')}…`;
}

function siteName(site: PublicSite | undefined, t: TFunction): string {
  return site?.profil.nom || t('site.defaultName');
}

export function pageMeta(
  page: PageKey,
  site: PublicSite | undefined,
  language: Language,
  t: TFunction,
): PageMeta {
  const name = siteName(site, t);
  const headline = localized(site?.profil.titre, language);
  const pitch = plainExcerpt(localized(site?.profil.presentation.accroche, language));
  const title =
    page === 'home'
      ? [name, headline].filter(Boolean).join(' — ')
      : `${t(`seo.${page}.title`)} — ${name}`;
  const description = page === 'home' ? pitch || headline : t(`seo.${page}.description`, { name });
  return { title, description, image: null };
}

export function projectMeta(
  projet: PublicProjetDetail,
  site: PublicSite | undefined,
  language: Language,
  t: TFunction,
): PageMeta {
  return {
    title: `${localized(projet.titre, language)} — ${siteName(site, t)}`,
    description: plainExcerpt(localized(projet.resume, language)),
    image: projet.image,
  };
}

/** Met à jour le titre de l'onglet et la description lors de la navigation. */
export function useSeo(meta: PageMeta): void {
  useEffect(() => {
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  }, [meta.title, meta.description]);
}

export function usePageSeo(page: PageKey, site: PublicSite | undefined): void {
  const { t } = useTranslation();
  const language = useLanguage();
  useSeo(pageMeta(page, site, language, t));
}
