/** Contenu fictif pour les tests (aucune donnée réelle). */

import { EMPTY_CONTENT } from '../admin/project';
import type { PublicProjetCard, PublicProjetDetail, PublicSite } from '../lib/types';

const text = (fr: string, en = '') => ({ fr, en });

function card(slug: string, overrides: Partial<PublicProjetCard> = {}): PublicProjetCard {
  return {
    slug,
    titre: text(`Projet ${slug}`, `Project ${slug}`),
    resume: text(`Résumé de ${slug}`),
    categorie: 'personnel',
    etat: 'termine',
    acces_code: 'public',
    est_phare: false,
    metiers: [],
    technologies: [],
    types_demo: [],
    niveau_demo: 0,
    image: null,
    date_publication: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const analyst = { slug: 'data-analyst', nom: text('Data Analyst', 'Data Analyst') };
const engineer = { slug: 'data-engineer', nom: text('Data Engineer', 'Data Engineer') };
const fullStack = {
  slug: 'full-stack',
  nom: text('Développeuse Full Stack', 'Full Stack Developer'),
};

export const SITE: PublicSite = {
  profil: {
    nom: 'Exemple Nom',
    titre: text('Étudiante (exemple)', 'Student (example)'),
    presentation: {
      accroche: text('Accroche **fictive**.', 'Fictitious pitch.'),
      profil: text('Profil fictif.'),
      orientation: text(''),
      methode: text('Méthode fictive.'),
    },
    email: 'contact@example.com',
    liens: {
      linkedin: 'https://www.linkedin.com/in/exemple',
      github: 'https://github.com/exemple',
    },
    cv_url: '/uploads/cv.pdf',
  },
  metiers: [analyst, engineer, fullStack],
  projets: [
    card('tableau-de-bord', {
      est_phare: true,
      metiers: [{ ...analyst, pertinence: 3 }],
      technologies: [1],
      types_demo: ['notebook'],
      niveau_demo: 4,
      categorie: 'academique',
    }),
    card('pipeline', {
      est_phare: true,
      metiers: [
        { ...engineer, pertinence: 3 },
        { ...analyst, pertinence: 1 },
      ],
      technologies: [2],
      types_demo: ['video'],
      niveau_demo: 2,
    }),
    card('application', {
      est_phare: true,
      metiers: [{ ...fullStack, pertinence: 3 }],
      technologies: [3],
      types_demo: ['visite', 'video'],
      niveau_demo: 3,
      acces_code: 'confidentiel',
    }),
  ],
  technologies: [
    {
      id: 1,
      nom: 'Pandas',
      domaine: text('Analyse de données', 'Data analysis'),
      niveau: 'bonne_maitrise',
      projets: ['tableau-de-bord'],
    },
    {
      id: 2,
      nom: 'Spark',
      domaine: text('Big Data', 'Big Data'),
      niveau: 'pratique',
      projets: ['pipeline'],
    },
    {
      id: 3,
      nom: 'React',
      domaine: text('Développement web', 'Web development'),
      niveau: 'pratique',
      projets: ['application'],
    },
    { id: 4, nom: 'Hadoop', domaine: text('Big Data', 'Big Data'), niveau: 'notions', projets: [] },
  ],
  parcours: [
    {
      id: 1,
      type: 'formation',
      titre: text('Formation fictive', 'Fictitious degree'),
      etablissement: 'École Exemple',
      date_debut: '2024-09-01',
      date_fin: null,
      description: text('Description fictive.'),
      justificatif_url: null,
    },
  ],
  genere_le: '2026-01-01T00:00:00Z',
};

export function projectDetail(overrides: Partial<PublicProjetDetail> = {}): PublicProjetDetail {
  return {
    ...card('application', { niveau_demo: 3, types_demo: ['visite', 'video'] }),
    protege: false,
    contenu: {
      ...EMPTY_CONTENT,
      contexte: text('Contexte **fictif**.'),
      chiffres: [{ valeur: '0,87', libelle: text('Score F1') }],
      methode: { ...EMPTY_CONTENT.methode, decisions: text('Décision fictive.') },
      liens: { ...EMPTY_CONTENT.liens, github: 'https://github.com/exemple/projet' },
    },
    technologies_detail: [SITE.technologies[2]!],
    galerie: [{ id: 1, type: 'image', url: '/uploads/a.png', legende: text('Capture fictive') }],
    demos: [
      {
        id: 10,
        type: 'visite',
        url: '',
        config: {
          titre: text(''),
          cadre: 'telephone',
          adresse_connexion: '',
          roles: [],
          sous_titres: text(''),
        },
        etapes: [
          {
            id: 1,
            ordre: 0,
            image_url: '/uploads/1.png',
            zone: { x: 10, y: 10, largeur: 20, hauteur: 20 },
            legende: text('Premier écran'),
          },
          {
            id: 2,
            ordre: 1,
            image_url: '/uploads/2.png',
            zone: null,
            legende: text('Second écran'),
          },
        ],
      },
      {
        id: 11,
        type: 'video',
        url: 'https://youtu.be/abc123XYZ_-',
        config: {
          titre: text(''),
          cadre: 'navigateur',
          adresse_connexion: '',
          roles: [],
          sous_titres: text(''),
        },
        etapes: [],
      },
    ],
    ...overrides,
  };
}
