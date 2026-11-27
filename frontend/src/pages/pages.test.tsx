import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';

import App from '../App';
import { seedContent } from '../lib/content';
import { sortProjects, sortTechnologies, withMetier } from '../lib/metier';
import { createQueryClient } from '../lib/queryClient';
import { pageMeta, plainExcerpt, projectMeta } from '../lib/seo';
import type { PublicProjetDetail } from '../lib/types';
import { projectDetail, SITE } from '../test/fixtures';
import { filterProjects } from './Projects';

let currentUrl = '';
function LocationProbe() {
  const location = useLocation();
  currentUrl = location.pathname + location.search;
  return null;
}

function renderSite(route: string, projet?: PublicProjetDetail) {
  const queryClient = createQueryClient();
  seedContent(queryClient, { site: SITE, projet });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  window.scrollTo = vi.fn();
});

const cardTitles = () =>
  screen.getAllByRole('article').map((article) => within(article).getByRole('link').textContent);
const jsonCalls = (path: string) =>
  fetchMock.mock.calls
    .filter(([url]) => url === path)
    .map(([, init]) => JSON.parse((init as RequestInit).body as string));

describe('entrée par métier', () => {
  test('les projets pertinents passent en tête, à pertinence égale l’ordre est gardé', () => {
    const order = (metier: string | null) => sortProjects(SITE.projets, metier).map((p) => p.slug);
    expect(order(null)).toEqual(['tableau-de-bord', 'pipeline', 'application']);
    expect(order('data-engineer')).toEqual(['pipeline', 'tableau-de-bord', 'application']);
    expect(order('data-analyst')).toEqual(['tableau-de-bord', 'pipeline', 'application']);
    expect(order('full-stack')[0]).toBe('application');
  });

  test('les compétences du métier choisi passent en tête', () => {
    const names = sortTechnologies(SITE.technologies, SITE.projets, 'full-stack').map((t) => t.nom);
    expect(names).toEqual(['React', 'Pandas', 'Spark', 'Hadoop']);
  });

  test('le métier est gardé dans les liens', () => {
    expect(withMetier('/projets', 'data-engineer')).toBe('/projets?metier=data-engineer');
    expect(withMetier('/competences#competence-3', 'full-stack')).toBe(
      '/competences?metier=full-stack#competence-3',
    );
    expect(withMetier('/contact', null)).toBe('/contact');
  });

  test('un lien ?metier= réordonne l’accueil ; le choix s’écrit dans l’URL et suit la navigation', async () => {
    renderSite('/?metier=full-stack');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Exemple Nom');
    expect(cardTitles()[0]).toBe('Projet application');
    expect(screen.getByRole('button', { name: 'Développeuse Full Stack' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Data Engineer' }));
    expect(currentUrl).toBe('/?metier=data-engineer');
    expect(cardTitles()[0]).toBe('Projet pipeline');

    await userEvent.click(screen.getAllByRole('link', { name: 'Projets' })[0]!);
    expect(currentUrl).toBe('/projets?metier=data-engineer');
    expect(cardTitles()[0]).toBe('Projet pipeline');

    await userEvent.click(screen.getByRole('button', { name: 'Tous les métiers' }));
    expect(currentUrl).toBe('/projets');
  });
});

describe('page Projets', () => {
  test('filtres secondaires', () => {
    const none = { domaine: '', technologie: '', demo: '', categorie: '' };
    const slugs = (filters: Partial<typeof none>) =>
      filterProjects(SITE.projets, SITE.technologies, { ...none, ...filters }).map((p) => p.slug);
    expect(slugs({})).toHaveLength(3);
    expect(slugs({ domaine: 'Big Data' })).toEqual(['pipeline']);
    expect(slugs({ technologie: '3' })).toEqual(['application']);
    expect(slugs({ demo: 'video' })).toEqual(['pipeline', 'application']);
    expect(slugs({ categorie: 'academique' })).toEqual(['tableau-de-bord']);
    expect(slugs({ demo: 'video', categorie: 'academique' })).toEqual([]);
  });

  test('chaque carte porte les 3 badges ; filtrer met à jour la liste', async () => {
    renderSite('/projets');
    const first = screen.getAllByRole('article')[0]!;
    expect(
      within(first)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['CodePublic', 'ÉtatTerminé', 'DémoNotebook']);
    await userEvent.selectOptions(screen.getByLabelText('Type de démo'), 'visite');
    expect(cardTitles()).toEqual(['Projet application']);
    expect(screen.getByText('1 projet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Effacer les filtres' }));
    expect(cardTitles()).toHaveLength(3);
  });
});

describe('fiche projet', () => {
  test('fiche complète, vue enregistrée avec le métier, démo lancée comptée une fois', async () => {
    renderSite('/projets/application?metier=full-stack', projectDetail());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Projet application');
    for (const title of [
      'Démonstration',
      'Contexte et problématique',
      'Objectifs et résultats',
      'Comment je travaille',
      'Galerie',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
    expect(screen.getByText('0,87')).toBeInTheDocument();
    // En-tête : technologies et liens directement sous les badges (variante A).
    expect(screen.getByRole('link', { name: /React/ })).toHaveAttribute(
      'href',
      '/competences#competence-3',
    );
    const header = within(screen.getAllByRole('banner')[1]!);
    expect(header.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/exemple/projet',
    );
    await waitFor(() =>
      expect(jsonCalls('/api/public/consultations')).toEqual([
        { slug: 'application', metier_choisi: 'full-stack' },
      ]),
    );

    // La visite guidée (démo principale) est affichée ; la vidéo est en onglet.
    expect(screen.getByText('Premier écran')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Vidéo' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Vidéo' }));
    expect(screen.getByTitle('Vidéo')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/abc123XYZ_-',
    );
    expect(jsonCalls('/api/public/consultations').filter((call) => call.type_demo)).toEqual([
      { slug: 'application', type_demo: 'video', metier_choisi: 'full-stack' },
    ]);
  });

  test('projet confidentiel : en-tête seul, puis contenu après saisie du code', async () => {
    const locked = projectDetail({
      protege: true,
      contenu: null,
      demos: [],
      galerie: [],
      acces_code: 'confidentiel',
    });
    renderSite('/projets/application', locked);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Projet confidentiel' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('0,87')).not.toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'code_invalide' }), { status: 403 }),
    );
    await userEvent.type(screen.getByLabelText("Code d'accès"), 'AAAA-BBBB');
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le projet' }));
    expect(await screen.findByText('Ce code est invalide ou a expiré.')).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(projectDetail({ acces_code: 'confidentiel' })), { status: 200 }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le projet' }));
    expect(await screen.findByText('0,87')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Projet confidentiel' })).not.toBeInTheDocument();
  });

  test('demande d’accès : validation puis envoi', async () => {
    const locked = projectDetail({ protege: true, contenu: null, demos: [], galerie: [] });
    renderSite('/projets/application', locked);
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
    expect(await screen.findByText('Indiquez votre entreprise.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Nom'), 'Awa Koné');
    await userEvent.type(screen.getByLabelText('Entreprise'), 'Entreprise Exemple');
    await userEvent.type(screen.getByLabelText('E-mail'), 'awa@example.com');
    await userEvent.type(
      screen.getByLabelText('Motif de la demande'),
      'Consulter une étude de cas.',
    );
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ recu: true }), { status: 201 }));
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
    expect(await screen.findByText(/Demande envoyée/)).toBeInTheDocument();
    expect(jsonCalls('/api/public/projets/application/demandes-acces')[0]).toMatchObject({
      entreprise: 'Entreprise Exemple',
      site_web: '',
    });
  });
});

describe('autres pages', () => {
  test('À propos : slogan, chiffres calculés, sections remplies seulement, offres, parcours', async () => {
    renderSite('/a-propos');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Slogan fictif.');
    // Chiffres clés calculés à partir du contenu publié.
    const published = screen.getByText('projets publiés').closest('div')!;
    expect(within(published).getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Profil' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 3, name: 'Orientation' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Offre data-engineer' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Disponible · dès maintenant/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Formation fictive' }),
    ).toBeInTheDocument();
  });

  test('Compétences : matrice compétences × projets et compétences en cours', async () => {
    renderSite('/competences');
    const spark = screen.getByRole('row', { name: /Spark/ });
    expect(within(spark).getByText('Pratique')).toBeInTheDocument();
    expect(within(spark).getAllByRole('img', { name: 'utilisée' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Projet pipeline' })).toHaveAttribute(
      'href',
      '/projets/pipeline',
    );
    // Filtrer par domaine réduit le tableau.
    await userEvent.click(screen.getByRole('button', { name: 'Développement web' }));
    expect(screen.queryByRole('row', { name: /Spark/ })).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: /React/ })).toBeInTheDocument();
    // Hadoop n'a pas de projet : il est « en cours », avec sa source et son étape.
    const hadoop = screen.getByRole('heading', { level: 3, name: 'Hadoop' }).closest('li')!;
    expect(within(hadoop).getByText('Cours fictif')).toBeInTheDocument();
    expect(within(hadoop).getByText(/Exercices/)).toHaveTextContent('✓');
  });

  test('Contact : coordonnées, validation et envoi du formulaire', async () => {
    renderSite('/contact?objet=stage');
    const main = within(screen.getByRole('main'));
    expect(main.getByLabelText('Objet')).toHaveValue('stage');
    expect(main.getByRole('link', { name: 'contact@example.com' })).toHaveAttribute(
      'href',
      'mailto:contact@example.com',
    );
    expect(screen.getByRole('link', { name: 'Télécharger le CV (PDF)' })).toHaveAttribute(
      'href',
      '/uploads/cv.pdf',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(await screen.findByText('Saisissez une adresse e-mail valide.')).toBeInTheDocument();
    expect(jsonCalls('/api/public/messages')).toEqual([]);

    await userEvent.type(screen.getByLabelText('Nom'), 'Awa');
    await userEvent.type(screen.getByLabelText(/Entreprise/), 'Agri CI');
    await userEvent.type(screen.getByLabelText('E-mail'), 'awa@example.com');
    await userEvent.type(screen.getByLabelText('Message'), 'Bonjour, une offre de stage.');
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ recu: true }), { status: 201 }));
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(await screen.findByText(/Message envoyé/)).toBeInTheDocument();
    expect(jsonCalls('/api/public/messages')[0]).toMatchObject({
      objet: 'stage',
      entreprise: 'Agri CI',
    });
  });

  test('bouton de langue : le site passe en anglais, avec repli sur le français', async () => {
    renderSite('/projets');
    await userEvent.click(screen.getByRole('button', { name: 'en' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Projects');
    expect(cardTitles()[0]).toBe('Project tableau-de-bord');
    expect(screen.getByText('Résumé de pipeline')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    await userEvent.click(screen.getByRole('button', { name: 'fr' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Projets');
  });

  test('page inconnue', () => {
    renderSite('/nulle-part');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page introuvable');
  });
});

describe('titres et descriptions', () => {
  const t = ((key: string, options?: { name?: string }) =>
    `${key}${options?.name ? `:${options.name}` : ''}`) as never;

  test('par page et par projet', () => {
    expect(pageMeta('home', SITE, 'fr', t)).toEqual({
      title: 'Exemple Nom — Étudiante (exemple)',
      description: 'Accroche fictive.',
      image: null,
    });
    expect(pageMeta('skills', SITE, 'fr', t).title).toBe('seo.skills.title — Exemple Nom');
    const meta = projectMeta(projectDetail({ image: '/uploads/a.png' }), SITE, 'en', t);
    expect(meta).toEqual({
      title: 'Project application — Exemple Nom',
      description: 'Résumé de application',
      image: '/uploads/a.png',
    });
  });

  test('extrait sans Markdown, coupé à 160 caractères', () => {
    expect(plainExcerpt('## Titre\n\n**Gras** et [lien](https://x.test) ![img](/a.png)')).toBe(
      'Titre Gras et lien',
    );
    const long = plainExcerpt('mot '.repeat(100));
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith('…')).toBe(true);
  });
});
