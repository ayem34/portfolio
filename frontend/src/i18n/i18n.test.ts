import en from './en.json';
import fr from './fr.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

const frKeys = flattenKeys(fr);

test('les fichiers FR et EN ont exactement les mêmes clés', () => {
  expect(flattenKeys(en).sort()).toEqual([...frKeys].sort());
});

test('aucune traduction vide', () => {
  const lookup = (source: unknown, key: string) =>
    key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], source);
  for (const key of frKeys) {
    expect(lookup(fr, key), `fr: ${key}`).not.toBe('');
    expect(lookup(en, key), `en: ${key}`).not.toBe('');
  }
});

test('chaque libellé utilisé dans le code existe dans les traductions', () => {
  const sources = import.meta.glob<string>('../**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });
  // t('cle'), ainsi que les clés passées par propriété (successKey, messageKey, labelKey)
  // et les ternaires t(condition ? 'a' : 'b').
  const patterns = [
    /\bt\(\s*'([^']+)'/g,
    /(?:successKey|messageKey|labelKey)\s*[:=]\s*["']([^"']+)["']/g,
    /\?\s*'((?:admin|demo|tour|project|projects|contact|errors|common)\.[\w.]+)'\s*:\s*'((?:admin|demo|tour|project|projects|contact|errors|common)\.[\w.]+)'/g,
  ];
  const used = new Set<string>();
  for (const [path, source] of Object.entries(sources)) {
    if (path.includes('.test.')) continue;
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        match.slice(1).forEach((key) => key && used.add(key));
      }
    }
  }
  expect(used.size).toBeGreaterThan(100);
  // Une clé au pluriel existe sous les formes « cle_one » et « cle_other ».
  const missing = [...used].filter(
    (key) => !frKeys.includes(key) && !frKeys.includes(`${key}_other`),
  );
  expect(missing).toEqual([]);
});

test('chaque valeur de liste a son libellé', async () => {
  const types = await import('../lib/types');
  const expected = [
    ...types.CATEGORIES.map((value) => `enums.categorie.${value}`),
    ...types.ETATS.map((value) => `enums.etat.${value}`),
    ...types.ACCES_CODES.map((value) => `enums.acces_code.${value}`),
    ...types.NIVEAUX.map((value) => `enums.niveau.${value}`),
    ...types.TYPES_DEMO.flatMap((value) => [
      `enums.type_demo.${value}`,
      `admin.demo.help.${value}`,
      `badges.demoLevel.${value}`,
    ]),
    ...types.TYPES_PARCOURS.map((value) => `enums.type_parcours.${value}`),
    ...types.CADRES.map((value) => `enums.cadre.${value}`),
    ...types.METHODE_KEYS.map((value) => `project.method.${value}`),
    ...types.LIEN_KEYS.map((value) => `project.link.${value}`),
    ...types.PRESENTATION_KEYS.flatMap((value) => [
      `admin.profile.sections.${value}`,
      `admin.profile.sectionHints.${value}`,
    ]),
  ];
  expect(expected.filter((key) => !frKeys.includes(key))).toEqual([]);
});
