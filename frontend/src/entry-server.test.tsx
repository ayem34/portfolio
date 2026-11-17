import { metaFor, projectPath, renderPage, STATIC_PAGES } from './entry-server';
import { projectDetail, SITE } from './test/fixtures';

describe('pré-rendu des pages publiques', () => {
  test.each(Object.keys(STATIC_PAGES))('%s est rendu en HTML avec son titre', (url) => {
    const html = renderPage(url, { site: SITE });
    expect(html).toContain('<h1');
    expect(html).toContain('Exemple Nom');
    expect(metaFor(url, { site: SITE }).title).toContain('Exemple Nom');
  });

  test('l’accueil contient les projets phares, sans dépendre du navigateur', () => {
    const html = renderPage('/', { site: SITE });
    expect(html).toContain('Projet tableau-de-bord');
    expect(html).toContain('href="/projets/pipeline"');
  });

  test('une fiche projet est rendue avec son contenu et ses balises de partage', () => {
    const projet = projectDetail({ image: '/uploads/a.png' });
    const content = { site: SITE, projet };
    const html = renderPage(projectPath(projet.slug), content);
    expect(html).toContain('Projet application');
    expect(html).toContain('Premier écran');
    expect(html).toContain('0,87');
    expect(metaFor(projectPath(projet.slug), content)).toEqual({
      title: 'Projet application — Exemple Nom',
      description: 'Résumé de application',
      image: '/uploads/a.png',
    });
  });

  test('une fiche confidentielle pré-rendue ne contient que son en-tête', () => {
    const projet = projectDetail({ protege: true, contenu: null, demos: [], galerie: [] });
    const html = renderPage(projectPath(projet.slug), { site: SITE, projet });
    expect(html).toContain('Projet confidentiel');
    expect(html).not.toContain('0,87');
  });

  test('l’admin n’est jamais pré-rendu', () => {
    expect(renderPage('/admin', { site: SITE })).not.toContain('Tableau de bord');
  });
});
