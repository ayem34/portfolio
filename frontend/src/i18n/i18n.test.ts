import en from './en.json';
import fr from './fr.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

test('les fichiers FR et EN ont exactement les mêmes clés', () => {
  expect(flattenKeys(en).sort()).toEqual(flattenKeys(fr).sort());
});
