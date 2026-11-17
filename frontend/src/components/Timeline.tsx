import { useTranslation } from 'react-i18next';

import { formatDate, useLanguage, useLocalized } from '../lib/localized';
import type { Parcours } from '../lib/types';
import { Badge } from './Badge';

/** Frise unique du parcours : formations, stage, certifications, hackathons, challenges. */
export function Timeline({ entries }: { entries: Parcours[] }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const language = useLanguage();
  const month = (value: string) => formatDate(value, language, { month: 'short', year: 'numeric' });

  return (
    <ol className="border-border space-y-8 border-l-2 pl-6">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className="bg-accent absolute top-1.5 -left-[1.95rem] size-3 rounded-full"
            aria-hidden="true"
          />
          <p className="text-muted text-sm">
            {month(entry.date_debut)} –{' '}
            {entry.date_fin ? month(entry.date_fin) : t('timeline.ongoing')}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{l(entry.titre)}</h3>
          <p className="text-muted">{entry.etablissement}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="accent">{t(`enums.type_parcours.${entry.type}`)}</Badge>
            {entry.justificatif_url && (
              <a
                className="text-accent text-sm underline"
                href={entry.justificatif_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('timeline.viewProof')}
              </a>
            )}
          </div>
          {l(entry.description) && <p className="mt-3 max-w-3xl">{l(entry.description)}</p>}
        </li>
      ))}
    </ol>
  );
}
