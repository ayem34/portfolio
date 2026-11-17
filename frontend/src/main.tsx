import './index.css';
import './i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { type InitialContent, seedContent } from './lib/content';
import { createQueryClient } from './lib/queryClient';

declare global {
  interface Window {
    /** Contenu inséré dans les pages pré-générées (voir scripts/prerender.mjs). */
    __CONTENT__?: InitialContent;
  }
}

const queryClient = createQueryClient();
const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
const root = document.getElementById('root')!;

const content = window.__CONTENT__;
if (content) seedContent(queryClient, content);

if (content && !content.notFound) {
  // Page pré-générée : React reprend le HTML déjà affiché, avec le même contenu.
  hydrateRoot(root, app);
} else {
  // Admin, serveur de développement et page 404 (son HTML ne correspond pas forcément
  // à l'adresse demandée) : rendu classique.
  createRoot(root).render(app);
}
