import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDate, useLanguage, useLocalized } from '../lib/localized';
import { metierClass } from '../lib/metierStyle';
import type { CouleurMetier, Parcours, TypeParcours } from '../lib/types';
import { Reveal } from './design/Reveal';

/** Couleur et icône de chaque type d'étape (cohérentes avec le reste du site). */
const TYPE_STYLE: Record<TypeParcours, { couleur: CouleurMetier; icon: ReactNode }> = {
  formation: { couleur: 'vert', icon: <path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5" /> },
  stage: {
    couleur: 'ambre',
    icon: <path d="M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
  },
  certification: {
    couleur: 'violet',
    icon: (
      <>
        <circle cx="12" cy="9" r="5" />
        <path d="M9 13l-2 8 5-3 5 3-2-8" />
      </>
    ),
  },
  hackathon: { couleur: 'bleu', icon: <path d="M13 2L4 14h7l-1 8 9-12h-7z" /> },
  challenge: {
    couleur: 'corail',
    icon: (
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 6h3a3 3 0 0 1-3 4M7 6H4a3 3 0 0 0 3 4" />
    ),
  },
};

/** Les filtres regroupent les types : stage = expérience, hackathon + challenge ensemble. */
const GROUPS = {
  formation: ['formation'],
  experience: ['stage'],
  challenges: ['challenge', 'hackathon'],
  certification: ['certification'],
} as const satisfies Record<string, readonly TypeParcours[]>;
type Group = keyof typeof GROUPS | 'all';

function TypeIcon({ type }: { type: TypeParcours }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--m-soft)] text-[var(--m)]">
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {TYPE_STYLE[type].icon}
      </svg>
    </span>
  );
}

interface TimelineProps {
  entries: Parcours[];
  /** Affiche les filtres par type (page À propos). */
  filterable?: boolean;
}

/**
 * Frise du parcours en arbre : les étapes alternent à gauche et à droite d'un axe central,
 * avec un repère à chaque nouvelle année. Sur téléphone, une seule colonne.
 */
export function Timeline({ entries, filterable = false }: TimelineProps) {
  const { t } = useTranslation();
  const l = useLocalized();
  const language = useLanguage();
  const [group, setGroup] = useState<Group>('all');
  const month = (value: string) => formatDate(value, language, { month: 'short', year: 'numeric' });

  const period = (entry: Parcours) => {
    const start = month(entry.date_debut);
    if (!entry.date_fin) return `${start} – ${t('timeline.ongoing')}`;
    const end = month(entry.date_fin);
    // Même mois de début et de fin (un hackathon, un challenge) : une seule date.
    return start === end ? start : `${start} – ${end}`;
  };

  const counts = Object.fromEntries(
    Object.entries(GROUPS).map(([key, types]) => [
      key,
      entries.filter((entry) => (types as readonly TypeParcours[]).includes(entry.type)).length,
    ]),
  ) as Record<keyof typeof GROUPS, number>;
  const shown =
    group === 'all'
      ? entries
      : entries.filter((entry) => (GROUPS[group] as readonly TypeParcours[]).includes(entry.type));
  const groups = (Object.keys(GROUPS) as (keyof typeof GROUPS)[]).filter((key) => counts[key] > 0);

  let previousYear = '';
  return (
    <div className="space-y-8">
      {filterable && groups.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('timeline.filterLabel')}>
          {(['all', ...groups] as Group[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={group === key}
              onClick={() => setGroup(key)}
              className={`btn ${group === key ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t(`timeline.groups.${key}`)}
              <span className="opacity-60">{key === 'all' ? entries.length : counts[key]}</span>
            </button>
          ))}
        </div>
      )}
      <ol className="relative space-y-6">
        <span
          className="from-accent via-border to-success absolute top-0 bottom-0 left-5 w-0.5 bg-gradient-to-b md:left-1/2 md:-ml-px"
          aria-hidden="true"
        />
        {shown.map((entry, index) => {
          const year = entry.date_debut.slice(0, 4);
          const newYear = group === 'all' && year !== previousYear;
          previousYear = year;
          const left = index % 2 === 0;
          return (
            <li
              key={entry.id}
              className={`${metierClass(TYPE_STYLE[entry.type].couleur)} relative grid grid-cols-[2.5rem_1fr] gap-4 md:grid-cols-[1fr_4rem_1fr] md:gap-0`}
            >
              <div
                className="relative col-start-1 row-start-1 flex justify-center pt-7 md:col-start-2"
                aria-hidden="true"
              >
                {newYear && (
                  <span className="bg-fg text-bg font-display absolute top-0 rounded-full px-2 py-0.5 text-xs font-bold">
                    {year}
                  </span>
                )}
                <span className="border-bg relative size-4 rounded-full border-[3px] bg-[var(--m)] shadow-[0_0_0_2px_var(--m)]" />
              </div>
              <Reveal
                delay={0.05 * (index % 4)}
                className={`card flex flex-col gap-1.5 border-t-[3px] border-t-[var(--m)] p-5 shadow-sm transition-transform hover:-translate-y-1 col-start-2 row-start-1 ${left ? 'md:col-start-1' : 'md:col-start-3'}`}
              >
                <div className="mb-1 flex items-center gap-3">
                  <TypeIcon type={entry.type} />
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[var(--m)] uppercase">
                      {t(`enums.type_parcours.${entry.type}`)}
                    </p>
                    <p className="text-muted text-sm font-semibold">{period(entry)}</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold">{l(entry.titre)}</h3>
                {entry.etablissement && <p className="text-muted text-sm">{entry.etablissement}</p>}
                {l(entry.description) && <p className="text-sm">{l(entry.description)}</p>}
                {entry.justificatif_url && (
                  <a
                    className="mt-1 text-sm font-semibold text-[var(--m)] hover:underline"
                    href={entry.justificatif_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('timeline.viewProof')} →
                  </a>
                )}
              </Reveal>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
