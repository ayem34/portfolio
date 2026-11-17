/** Entrée du pré-rendu : produit le HTML et les balises d'en-tête d'une page publique. */

import './i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import i18n from 'i18next';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

import App from './App';
import { DEFAULT_LANGUAGE } from './i18n';
import { type InitialContent, seedContent } from './lib/content';
import { createQueryClient } from './lib/queryClient';
import { type PageKey, pageMeta, type PageMeta, projectMeta } from './lib/seo';

export type { InitialContent, PageMeta };

/** Pages publiques fixes : adresse → clé de titre et de description. */
export const STATIC_PAGES: Record<string, PageKey> = {
  '/': 'home',
  '/projets': 'projects',
  '/a-propos': 'about',
  '/competences': 'skills',
  '/contact': 'contact',
  '/404': 'notFound',
};

export const projectPath = (slug: string) => `/projets/${slug}`;

export function renderPage(url: string, content: InitialContent): string {
  const queryClient = createQueryClient();
  seedContent(queryClient, content);
  return renderToString(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

export function metaFor(url: string, content: InitialContent): PageMeta {
  const t = i18n.getFixedT(DEFAULT_LANGUAGE);
  if (content.projet) return projectMeta(content.projet, content.site, DEFAULT_LANGUAGE, t);
  return pageMeta(STATIC_PAGES[url] ?? 'notFound', content.site, DEFAULT_LANGUAGE, t);
}
