/**
 * Service local « site » : remplace Vercel sur l'ordinateur d'Ayem.
 *
 * - sert le site généré (dist/) sur http://localhost:8080, API arrêtée ou non ;
 * - joue le rôle du deploy hook : POST /__deploy relance « npm run build » ;
 * - relaie /api vers l'API et sert /uploads, comme le fait l'hébergement en ligne.
 *
 * PORT, API_URL, UPLOADS_DIR : voir docker-compose.yml.
 */

import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { rename, rm, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

import { log, ROOT } from './content.mjs';

const PORT = Number(process.env.PORT ?? 8080);
const API_URL = new URL(process.env.API_URL ?? 'http://localhost:8000');
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR ?? path.join(ROOT, '..', 'uploads'));
const DIST = path.join(ROOT, 'dist');
const NEXT = path.join(ROOT, 'dist-next');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.vtt': 'text/vtt; charset=utf-8',
};

// --- Génération du site (une à la fois ; une demande reçue entre-temps est rejouée) ---

const state = { running: false, queued: false, last: null };

function runBuild() {
  if (state.running) {
    state.queued = true;
    return;
  }
  state.running = true;
  log('génération du site…');
  // Le site est généré à côté puis mis en place d'un coup : l'ancien reste servi entre-temps.
  const child = spawn('npm', ['run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, OUT_DIR: NEXT },
  });
  child.on('exit', async (code) => {
    if (code === 0) {
      await rm(DIST, { recursive: true, force: true });
      await rename(NEXT, DIST);
    }
    state.last = { ok: code === 0, date: new Date().toISOString() };
    state.running = false;
    log(code === 0 ? 'site à jour' : 'la génération a échoué : le site précédent est conservé');
    if (state.queued) {
      state.queued = false;
      runBuild();
    }
  });
}

// --- Réponses ---

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': MIME['.json'] });
  response.end(JSON.stringify(body));
}

async function sendFile(response, file, status = 200) {
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return false;
  const extension = path.extname(file).toLowerCase();
  const headers = { 'Content-Type': MIME[extension] ?? 'application/octet-stream' };
  // Même protection que l'API : un notebook ouvert directement est isolé.
  if (extension === '.html' && file.startsWith(UPLOADS_DIR)) {
    headers['Content-Security-Policy'] = 'sandbox allow-scripts';
  }
  response.writeHead(status, headers);
  createReadStream(file).pipe(response);
  return true;
}

/** Chemin demandé → fichier dans `root`, sans jamais en sortir. */
function resolveInside(root, pathname) {
  const file = path.join(root, path.normalize(decodeURIComponent(pathname)));
  return file.startsWith(root) ? file : null;
}

function proxyToApi(request, response) {
  const upstream = http.request(
    {
      host: API_URL.hostname,
      port: API_URL.port,
      path: request.url,
      method: request.method,
      headers: request.headers,
    },
    (apiResponse) => {
      response.writeHead(apiResponse.statusCode ?? 502, apiResponse.headers);
      apiResponse.pipe(response);
    },
  );
  // API arrêtée : le site reste affiché, seule l'action demandée échoue proprement.
  upstream.on('error', () => sendJson(response, 502, { detail: 'serveur_injoignable' }));
  request.pipe(upstream);
}

async function handle(request, response) {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');

  if (pathname === '/__deploy') {
    if (request.method === 'POST') {
      runBuild();
      return sendJson(response, 202, { declenchee: true });
    }
    return sendJson(response, 200, state);
  }
  if (pathname.startsWith('/api/')) return proxyToApi(request, response);
  if (pathname.startsWith('/uploads/')) {
    const file = resolveInside(UPLOADS_DIR, pathname.slice('/uploads'.length));
    if (file && (await sendFile(response, file))) return;
    return sendJson(response, 404, { detail: 'introuvable' });
  }

  const file = resolveInside(DIST, pathname);
  if (file) {
    if (await sendFile(response, file)) return;
    if (await sendFile(response, path.join(file, 'index.html'))) return;
  }
  // Toutes les adresses de l'admin mènent à sa coquille (routage côté navigateur).
  if (
    pathname.startsWith('/admin') &&
    (await sendFile(response, path.join(DIST, 'admin/index.html')))
  ) {
    return;
  }
  if (await sendFile(response, path.join(DIST, '404.html'), 404)) return;
  response.writeHead(503, { 'Content-Type': MIME['.txt'], 'Retry-After': '10' });
  response.end('Site en cours de génération. Rechargez la page dans une minute.\n');
}

http
  .createServer((request, response) => {
    handle(request, response).catch((error) => {
      console.error(error);
      if (!response.headersSent) sendJson(response, 500, { detail: 'erreur_inconnue' });
      else response.end();
    });
  })
  .listen(PORT, () => {
    log(`site généré servi sur http://localhost:${PORT}`);
    runBuild();
  });
