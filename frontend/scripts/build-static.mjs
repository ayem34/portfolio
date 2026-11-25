/**
 * Publication du site : « npm run build ».
 * C'est la commande lancée par Vercel à chaque déploiement, et par le service local
 * « site » quand on clique sur « Mettre le site à jour » dans l'admin.
 *
 *   1. contenu publié → fichiers JSON
 *   2. application navigateur (vite build) et version serveur (vite build --ssr)
 *   3. HTML de chaque page, sitemap.xml, robots.txt
 */

import { rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { build } from 'vite';

import { log, OUT_DIR, SSR_DIR } from './content.mjs';
import { fetchContent } from './fetch-content.mjs';
import { prerender } from './prerender.mjs';

export async function buildStatic() {
  await fetchContent();
  await build({ logLevel: 'warn', build: { outDir: OUT_DIR, emptyOutDir: true } });
  await build({
    logLevel: 'warn',
    build: { ssr: 'src/entry-server.tsx', outDir: SSR_DIR, emptyOutDir: true },
  });
  await prerender();
  await rm(SSR_DIR, { recursive: true, force: true });
  log('site généré');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildStatic().catch((error) => {
    console.error(`[publication] échec : ${error.message}`);
    process.exit(1);
  });
}
