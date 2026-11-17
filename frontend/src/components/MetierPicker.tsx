import { useTranslation } from 'react-i18next';

import { useLocalized } from '../lib/localized';
import { useMetier } from '../lib/metier';
import type { PublicMetier } from '../lib/types';

/** Entrée par métier : le choix est écrit dans l'URL (?metier=...). */
export function MetierPicker({ metiers }: { metiers: PublicMetier[] }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const [metier, setMetier] = useMetier();
  if (metiers.length === 0) return null;

  const options: { slug: string | null; label: string }[] = [
    { slug: null, label: t('metier.all') },
    ...metiers.map((item) => ({ slug: item.slug, label: l(item.nom) })),
  ];
  return (
    <div role="group" aria-label={t('metier.label')}>
      <p className="text-muted mb-3 text-sm font-medium">{t('metier.label')}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.slug === metier;
          return (
            <button
              key={option.slug ?? 'all'}
              type="button"
              className={`btn ${selected ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={selected}
              onClick={() => setMetier(option.slug)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
