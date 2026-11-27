import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLocalized } from '../../lib/localized';
import { sortProjects, useMetier, withMetier } from '../../lib/metier';
import { useReveal } from '../../lib/reveal';
import type { PublicSite, PublicTechnologie } from '../../lib/types';

const ALL = '';
/** Huit teintes bien distinctes et lisibles sur le fond sable (contraste AA sur le texte). */
const DOMAIN_COLOURS = [
  '#c2410c',
  '#1d4f91',
  '#0f6b42',
  '#8a5a00',
  '#5b3fc4',
  '#0e7490',
  '#be185d',
  '#4d7c0f',
];
const colourStyle = (colour: string | undefined) => ({ '--m': colour }) as CSSProperties;

/**
 * Vue d'ensemble « quelle compétence, dans quel projet » : une ligne par compétence
 * prouvée, une colonne par projet. Survoler une ligne ou une colonne la met en valeur ;
 * les filtres réduisent le tableau à un domaine.
 */
export function SkillsMatrix({ site }: { site: PublicSite }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const [metier] = useMetier();
  const [domain, setDomain] = useState(ALL);
  const [column, setColumn] = useState<number | null>(null);
  const ref = useReveal<HTMLDivElement>();

  const proven = site.technologies.filter((item) => item.projets.length > 0);
  const domains = [...new Map(proven.map((item) => [item.domaine.fr, item.domaine])).entries()];
  // Chaque domaine garde la même couleur dans toute la page.
  const colourOf = new Map(
    domains.map(([key], index) => [key, DOMAIN_COLOURS[index % DOMAIN_COLOURS.length]]),
  );
  const rank = new Map(domains.map(([key], index) => [key, index]));
  const rows = proven
    .filter((item) => domain === ALL || item.domaine.fr === domain)
    .sort(
      (a, b) =>
        (rank.get(a.domaine.fr) ?? 0) - (rank.get(b.domaine.fr) ?? 0) ||
        b.projets.length - a.projets.length,
    );
  const projets = sortProjects(
    site.projets.filter((projet) => projet.technologies.length > 0),
    metier,
  );
  const maxUse = Math.max(1, ...proven.map((item) => item.projets.length));
  if (proven.length === 0 || projets.length === 0) return null;

  const uses = (technologie: PublicTechnologie, slug: string) => technologie.projets.includes(slug);

  return (
    <div ref={ref} className="reveal space-y-6">
      {domains.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('skills.domainFilter')}>
          {[[ALL, null] as const, ...domains].map(([key, label]) => (
            <button
              key={key || 'all'}
              type="button"
              aria-pressed={domain === key}
              onClick={() => setDomain(key)}
              style={key ? colourStyle(colourOf.get(key)) : undefined}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${domain === key ? 'bg-fg text-bg border-fg' : 'border-border hover:border-accent'}`}
            >
              {key && <span className="size-2.5 rounded bg-[var(--m)]" aria-hidden="true" />}
              {label ? l(label) : t('skills.allDomains')}
            </button>
          ))}
        </div>
      )}
      <div className="card overflow-x-auto p-2 shadow-sm">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{t('skills.matrixCaption')}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="text-muted px-4 py-3 text-left text-xs tracking-widest uppercase"
              >
                {t('skills.skill')}
              </th>
              {projets.map((projet, index) => (
                <th
                  key={projet.slug}
                  scope="col"
                  className={`rounded-xl px-2 py-3 text-center align-bottom transition-colors ${column === index ? 'bg-surface-2' : ''}`}
                  onMouseEnter={() => setColumn(index)}
                  onMouseLeave={() => setColumn(null)}
                >
                  <Link
                    to={withMetier(`/projets/${projet.slug}`, metier)}
                    className="font-display hover:text-accent block font-semibold"
                    onFocus={() => setColumn(index)}
                    onBlur={() => setColumn(null)}
                  >
                    {l(projet.titre)}
                  </Link>
                  <span className="text-muted text-xs font-normal">
                    {t(`enums.categorie.${projet.categorie}`)}
                  </span>
                </th>
              ))}
              <th
                scope="col"
                className="text-muted w-40 px-4 py-3 text-left text-xs tracking-widest uppercase"
              >
                {t('skills.projectCount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((technologie, rowIndex) => (
              <tr
                key={technologie.id}
                id={`competence-${technologie.id}`}
                style={colourStyle(colourOf.get(technologie.domaine.fr))}
                className="group scroll-mt-28"
              >
                <th
                  scope="row"
                  className="border-border group-hover:bg-surface-2 group-target:bg-surface-2 border-t px-4 py-2.5 text-left font-semibold whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <span className="size-2.5 rounded bg-[var(--m)]" aria-hidden="true" />
                    {technologie.nom}
                    <span className="text-faint text-xs font-normal">
                      {t(`enums.niveau.${technologie.niveau}`)}
                    </span>
                  </span>
                </th>
                {projets.map((projet, index) => {
                  const used = uses(technologie, projet.slug);
                  return (
                    <td
                      key={projet.slug}
                      className={`border-border group-hover:bg-surface-2 border-t px-2 py-2.5 text-center transition-colors ${column === index ? 'bg-surface-2' : ''}`}
                    >
                      {used ? (
                        <span
                          className="fig-pop inline-block size-4 rounded-full bg-[var(--m)]"
                          style={
                            { '--delay': `${0.2 + (rowIndex + index) * 0.04}s` } as CSSProperties
                          }
                          role="img"
                          aria-label={t('skills.usedInProject')}
                        />
                      ) : (
                        <span
                          className="bg-border inline-block size-1.5 rounded-full"
                          aria-hidden="true"
                        />
                      )}
                    </td>
                  );
                })}
                <td className="border-border group-hover:bg-surface-2 border-t px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="bg-surface-2 h-1.5 flex-1 overflow-hidden rounded-full">
                      <span
                        className="bar-fill block h-full rounded-full bg-[var(--m)]"
                        style={
                          {
                            width: `${(technologie.projets.length / maxUse) * 100}%`,
                            '--delay': `${0.4 + rowIndex * 0.05}s`,
                          } as CSSProperties
                        }
                      />
                    </span>
                    <b className="w-4 text-right">{technologie.projets.length}</b>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
