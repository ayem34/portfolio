/**
 * Étape 1 de la publication : récupère le contenu publié auprès de l'API et
 * l'enregistre en fichiers JSON.
 *
 * API_URL          adresse de l'API (défaut : http://localhost:8000)
 * CONTENT_FIXTURE  fichier JSON à utiliser à la place de l'API (CI, essais hors ligne)
 */

import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';

import { CONTENT_DIR, log, projectPath, ROOT, sitePath, writeJson } from './content.mjs';

const API_URL = (process.env.API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
// L'API gratuite peut être en veille : on insiste environ 3 minutes avant d'abandonner.
const MAX_ATTEMPTS = 36;
const RETRY_DELAY_MS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(pathname) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${API_URL}${pathname}`, { signal: AbortSignal.timeout(30000) });
      if (response.ok) return await response.json();
      lastError = new Error(`${pathname} : réponse ${response.status}`);
      // Une erreur 4xx ne se corrigera pas en réessayant.
      if (response.status < 500) break;
    } catch (error) {
      lastError = error;
    }
    log(`API pas encore disponible (essai ${attempt}/${MAX_ATTEMPTS})…`);
    await sleep(RETRY_DELAY_MS);
  }
  throw new Error(`Impossible de lire ${API_URL}${pathname} : ${lastError?.message}`);
}

async function loadContent() {
  if (process.env.CONTENT_FIXTURE) {
    const file = path.resolve(ROOT, process.env.CONTENT_FIXTURE);
    log(`contenu lu dans ${file}`);
    return JSON.parse(await readFile(file, 'utf8'));
  }
  log(`contenu demandé à ${API_URL}`);
  const site = await fetchJson('/api/public/site');
  const projets = [];
  for (const { slug } of site.projets) {
    projets.push(await fetchJson(`/api/public/projets/${encodeURIComponent(slug)}`));
  }
  return { site, projets };
}

export async function fetchContent() {
  const { site, projets } = await loadContent();
  await rm(CONTENT_DIR, { recursive: true, force: true });
  await writeJson(sitePath(CONTENT_DIR), site);
  for (const projet of projets) {
    await writeJson(projectPath(CONTENT_DIR, projet.slug), projet);
  }
  log(`${projets.length} projet(s) publié(s) récupéré(s)`);
}
