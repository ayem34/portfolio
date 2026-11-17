/** Emplacements et outils communs aux scripts de publication. */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** Contenu publié récupéré auprès de l'API (un fichier JSON par page de données). */
export const CONTENT_DIR = path.join(ROOT, '.content');
/** Version serveur de l'application, utilisée seulement pendant le pré-rendu. */
export const SSR_DIR = path.join(ROOT, '.ssr');
export const OUT_DIR = path.resolve(ROOT, process.env.OUT_DIR ?? 'dist');

export const sitePath = (dir) => path.join(dir, 'site.json');
export const projectPath = (dir, slug) => path.join(dir, 'projets', `${slug}.json`);

export async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data));
}

export function log(message) {
  console.log(`[publication] ${message}`);
}
