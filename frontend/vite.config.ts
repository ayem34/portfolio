/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// En développement, le navigateur ne parle qu'au serveur Vite :
// /api et /uploads sont relayés vers l'API.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': apiTarget,
      '/uploads': apiTarget,
      // Le site lit son contenu dans /data/*.json (fichiers générés à la publication).
      // En développement, ces adresses sont servies en direct par l'API.
      '/data/site.json': { target: apiTarget, rewrite: () => '/api/public/site' },
      '^/data/projets/[^/]+\\.json$': {
        target: apiTarget,
        rewrite: (path) =>
          path.replace(/^\/data\/projets\/([^/]+)\.json$/, '/api/public/projets/$1'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    css: false,
  },
});
