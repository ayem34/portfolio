/**
 * Étape 3 de la publication : génère le HTML de chaque page publique, les fichiers
 * de données, sitemap.xml et robots.txt.
 *
 * SITE_URL  adresse publique du site (liens absolus du sitemap et des aperçus de partage)
 */

import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { CONTENT_DIR, log, OUT_DIR, sitePath, SSR_DIR } from './content.mjs';

const SITE_URL = (
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:8080')
).replace(/\/$/, '');

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Dans une balise <script>, « < » est neutralisé pour qu'aucun texte ne puisse la refermer.
const inlineJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');
const absoluteUrl = (url) => (/^https?:\/\//.test(url) ? url : `${SITE_URL}${url}`);

function headTags(meta, url, { indexable }) {
  const pageUrl = absoluteUrl(url === '/' ? '/' : url);
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
  ];
  if (!indexable) {
    tags.push('<meta name="robots" content="noindex" />');
    return tags.join('\n    ');
  }
  tags.push(
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="fr_FR" />',
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" />`,
  );
  if (meta.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(absoluteUrl(meta.image))}" />`);
  }
  return tags.join('\n    ');
}

function fillTemplate(template, { head, html = '', data = '' }) {
  return template
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', html)
    .replace('<!--app-data-->', data);
}

async function writePage(file, html) {
  const target = path.join(OUT_DIR, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}

/** « /projets/exemple » → « projets/exemple/index.html » */
const fileFor = (url) => (url === '/' ? 'index.html' : `${url.slice(1)}/index.html`);

export async function prerender() {
  const { renderPage, metaFor, STATIC_PAGES, projectPath } = await import(
    pathToFileURL(path.join(SSR_DIR, 'entry-server.js')).href
  );
  const template = await readFile(path.join(OUT_DIR, 'index.html'), 'utf8');
  const site = JSON.parse(await readFile(sitePath(CONTENT_DIR), 'utf8'));
  const projectFiles = await readdir(path.join(CONTENT_DIR, 'projets')).catch(() => []);
  const projets = await Promise.all(
    projectFiles.map(async (file) =>
      JSON.parse(await readFile(path.join(CONTENT_DIR, 'projets', file), 'utf8')),
    ),
  );

  const pages = [
    ...Object.keys(STATIC_PAGES).map((url) => ({ url, content: { site } })),
    ...projets.map((projet) => ({ url: projectPath(projet.slug), content: { site, projet } })),
  ];
  for (const { url, content } of pages) {
    const notFound = url === '/404';
    const html = fillTemplate(template, {
      head: headTags(metaFor(url, content), url, { indexable: !notFound }),
      html: renderPage(url, content),
      data: `<script>window.__CONTENT__=${inlineJson(notFound ? { ...content, notFound } : content)}</script>`,
    });
    await writePage(notFound ? '404.html' : fileFor(url), html);
  }

  // L'admin n'est pas pré-rendu : une coquille vide, non indexée, charge l'application.
  const adminMeta = { title: 'Administration', description: '' };
  await writePage(
    'admin/index.html',
    fillTemplate(template, { head: headTags(adminMeta, '/admin', { indexable: false }) }),
  );

  // Données lues par le site lors de la navigation d'une page à l'autre.
  await cp(CONTENT_DIR, path.join(OUT_DIR, 'data'), { recursive: true });

  const indexable = pages.filter((page) => page.url !== '/404');
  const lastmod = new Date(site.genere_le).toISOString().slice(0, 10);
  await writePage(
    'sitemap.xml',
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...indexable.map(
        ({ url }) =>
          `  <url><loc>${escapeHtml(absoluteUrl(url))}</loc><lastmod>${lastmod}</lastmod></url>`,
      ),
      '</urlset>',
      '',
    ].join('\n'),
  );
  await writePage(
    'robots.txt',
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  );
  log(`${pages.length} pages générées dans ${OUT_DIR} (adresse du site : ${SITE_URL})`);
}
