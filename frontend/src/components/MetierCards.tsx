import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLocalized } from '../lib/localized';
import { metierClass } from '../lib/metierStyle';
import type { PublicMetierDetail, PublicSite } from '../lib/types';
import { MetierFigure } from './design/MetierFigure';
import { Reveal } from './design/Reveal';

const KEY_SKILLS = 4;

/** Projets du métier et compétences qu'ils utilisent le plus (calculés, jamais saisis). */
export function metierSummary(site: PublicSite, metier: PublicMetierDetail) {
  const projets = site.projets.filter((projet) =>
    projet.metiers.some((link) => link.slug === metier.slug && link.pertinence > 0),
  );
  const usage = new Map<number, number>();
  for (const projet of projets) {
    for (const id of projet.technologies) usage.set(id, (usage.get(id) ?? 0) + 1);
  }
  const names = new Map(site.technologies.map((item) => [item.id, item.nom]));
  const skills = [...usage.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, KEY_SKILLS)
    .flatMap(([id]) => names.get(id) ?? []);
  return { count: projets.length, skills };
}

/** Une carte par métier : figure animée, nombre de projets, compétences clés, lien filtré. */
export function MetierCards({ site }: { site: PublicSite }) {
  const { t } = useTranslation();
  const l = useLocalized();
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {site.metiers.map((metier, index) => {
        const { count, skills } = metierSummary(site, metier);
        return (
          <Reveal
            as="li"
            key={metier.slug}
            delay={index * 0.12}
            className={`${metierClass(metier.couleur)} card flex flex-col gap-4 border-t-4 border-t-[var(--m)] p-6 shadow-sm transition-transform hover:-translate-y-1`}
          >
            <MetierFigure figure={metier.figure} />
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold">{l(metier.nom)}</h3>
              <span className="rounded-full border border-[var(--m)] px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-[var(--m)]">
                {t('stats.projects', { count })}
              </span>
            </div>
            {l(metier.description) && <p className="text-muted flex-1">{l(metier.description)}</p>}
            {skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted text-xs font-semibold tracking-widest uppercase">
                  {t('home.keySkills')}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <li key={skill} className="rounded-md bg-[var(--m-soft)] px-2.5 py-1 text-sm">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              to={`/projets?metier=${encodeURIComponent(metier.slug)}`}
              className="border-border mt-auto border-t pt-4 font-semibold text-[var(--m)] hover:underline"
            >
              {t('home.seeMetierProjects', { metier: l(metier.nom) })} →
            </Link>
          </Reveal>
        );
      })}
    </ul>
  );
}
