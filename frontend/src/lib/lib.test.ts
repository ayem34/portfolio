import { moveItem } from '../admin/hooks';
import { slugify } from '../admin/project';
import { demoBadgeKey, sandboxLoginUrl, youtubeEmbedUrl } from './demo';
import { localized } from './localized';
import { clampZone, isZoneLargeEnough, pointToPercent, zoneFromPoints } from './zone';

describe('localized', () => {
  test('renvoie la langue demandée, sinon le français', () => {
    expect(localized({ fr: 'Bonjour', en: 'Hello' }, 'en')).toBe('Hello');
    expect(localized({ fr: 'Bonjour', en: '' }, 'en')).toBe('Bonjour');
    expect(localized(null, 'fr')).toBe('');
  });
});

describe('zone cliquable', () => {
  const box = { left: 100, top: 50, width: 400, height: 200 };

  test('convertit la position du pointeur en % de l’image', () => {
    expect(pointToPercent(300, 150, box)).toEqual({ x: 50, y: 50 });
    expect(pointToPercent(100, 50, box)).toEqual({ x: 0, y: 0 });
  });

  test('borne le pointeur sorti de l’image', () => {
    expect(pointToPercent(9999, -20, box)).toEqual({ x: 100, y: 0 });
  });

  test('le rectangle est le même quel que soit le sens du tracé', () => {
    const expected = { x: 10, y: 20, largeur: 30, hauteur: 40 };
    expect(zoneFromPoints({ x: 10, y: 20 }, { x: 40, y: 60 })).toEqual(expected);
    expect(zoneFromPoints({ x: 40, y: 60 }, { x: 10, y: 20 })).toEqual(expected);
  });

  test('un simple clic ne crée pas de zone', () => {
    expect(isZoneLargeEnough(zoneFromPoints({ x: 10, y: 10 }, { x: 10.5, y: 10.5 }))).toBe(false);
    expect(isZoneLargeEnough({ x: 0, y: 0, largeur: 5, hauteur: 5 })).toBe(true);
  });

  test('une zone saisie au clavier reste dans l’image', () => {
    expect(clampZone({ x: 90, y: -5, largeur: 30, hauteur: 0 })).toEqual({
      x: 70,
      y: 0,
      largeur: 30,
      hauteur: 2,
    });
  });
});

describe('démos', () => {
  test('le badge Démo affiche le niveau le plus élevé', () => {
    expect(demoBadgeKey({ niveau_demo: 6, types_demo: ['bac_a_sable', 'visite'] })).toBe(
      'bac_a_sable',
    );
    expect(demoBadgeKey({ niveau_demo: 1, types_demo: [] })).toBe('captures');
    expect(demoBadgeKey({ niveau_demo: 0, types_demo: ['lien_externe'] })).toBe('lien_externe');
    expect(demoBadgeKey({ niveau_demo: 0, types_demo: [] })).toBe('aucune');
  });

  test('reconnaît les liens YouTube', () => {
    const embed = 'https://www.youtube-nocookie.com/embed/abc123XYZ_-';
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=abc123XYZ_-')).toBe(embed);
    expect(youtubeEmbedUrl('https://youtu.be/abc123XYZ_-')).toBe(embed);
    expect(youtubeEmbedUrl('/uploads/video.mp4')).toBeNull();
  });

  test('ajoute le rôle à l’adresse de connexion du bac à sable', () => {
    expect(sandboxLoginUrl('https://demo.test/demo/login', 'passager')).toBe(
      'https://demo.test/demo/login?role=passager',
    );
    expect(sandboxLoginUrl('https://demo.test/login?demo=1', 'a b')).toBe(
      'https://demo.test/login?demo=1&role=a%20b',
    );
  });
});

describe('outils de l’admin', () => {
  test('slugify retire accents et ponctuation', () => {
    expect(slugify('Prédiction des départs RH !')).toBe('prediction-des-departs-rh');
    expect(slugify('  KÔVO — covoiturage  ')).toBe('kovo-covoiturage');
  });

  test('moveItem déplace sans modifier la liste d’origine', () => {
    const list = ['a', 'b', 'c'];
    expect(moveItem(list, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveItem(list, 0, 5)).toEqual(['a', 'b', 'c']);
    expect(list).toEqual(['a', 'b', 'c']);
  });
});
