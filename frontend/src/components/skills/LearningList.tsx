import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocalized } from '../../lib/localized';
import type { PublicTechnologie } from '../../lib/types';
import { Reveal } from '../design/Reveal';

const STEPS = 3;

/**
 * Compétences sans projet publié : présentées honnêtement comme « en cours », avec
 * l'endroit où elles s'apprennent et l'étape atteinte (cours suivi → exercices → projet prévu).
 */
export function LearningList({ technologies }: { technologies: PublicTechnologie[] }) {
  const { t } = useTranslation();
  const l = useLocalized();
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {technologies.map((technologie, index) => (
        <Reveal
          as="li"
          key={technologie.id}
          delay={0.1 * (index % 3)}
          className="border-border bg-surface flex flex-col gap-2 rounded-2xl border border-dashed p-5"
        >
          <div
            id={`competence-${technologie.id}`}
            className="flex scroll-mt-28 items-center justify-between gap-2"
          >
            <h3 className="font-bold">{technologie.nom}</h3>
            <span className="text-xs font-bold tracking-widest text-[#ffb36b] uppercase">
              {t('skills.learning')}
            </span>
          </div>
          <p className="text-muted text-sm">{l(technologie.source) || l(technologie.domaine)}</p>
          <ol className="relative mt-2 grid grid-cols-3" aria-label={t('skills.progressLabel')}>
            <span
              className="bg-border absolute top-[7px] right-[16%] left-[16%] h-0.5"
              aria-hidden="true"
            />
            {Array.from({ length: STEPS }, (_, step) => {
              const done = step < technologie.progression;
              return (
                <li key={step} className="relative flex flex-col items-center gap-1.5 text-center">
                  <span
                    className={`fig-pop size-3.5 rounded-full ${done ? 'bg-[#ffb36b]' : 'border-border bg-surface border-2'}`}
                    style={{ '--delay': `${0.3 + step * 0.15}s` } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span className={`text-xs ${done ? 'text-fg' : 'text-faint'}`}>
                    {t(`skills.steps.${step}`)}
                    {done && <span className="sr-only"> ✓</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </Reveal>
      ))}
    </ul>
  );
}
