import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocalized } from '../../lib/localized';
import { useMetier } from '../../lib/metier';
import { METIER_HEX } from '../../lib/metierStyle';
import { useReveal } from '../../lib/reveal';
import type { LocalizedText, PublicSite } from '../../lib/types';

const SIZE = 580;
const CENTER = SIZE / 2;
const RADIUS = 190;
const MAX_AXES = 8;

interface Axis {
  key: string;
  label: LocalizedText;
  technologyIds: Set<number>;
}

/** Axes = domaines de compétences prouvées par au moins un projet (les plus fournis d'abord). */
function axesOf(site: PublicSite): Axis[] {
  const axes = new Map<string, Axis>();
  for (const technologie of site.technologies) {
    if (technologie.projets.length === 0) continue;
    const axis = axes.get(technologie.domaine.fr) ?? {
      key: technologie.domaine.fr,
      label: technologie.domaine,
      technologyIds: new Set<number>(),
    };
    axis.technologyIds.add(technologie.id);
    axes.set(axis.key, axis);
  }
  return [...axes.values()]
    .sort((a, b) => b.technologyIds.size - a.technologyIds.size)
    .slice(0, MAX_AXES);
}

/**
 * Valeur d'un métier sur un axe : nombre de projets du métier qui utilisent ce domaine.
 * Calculé à partir des projets publiés, comme tout le reste de la page.
 */
export function radarValues(site: PublicSite) {
  const axes = axesOf(site);
  const series = site.metiers.map((metier) => {
    const projets = site.projets.filter((projet) =>
      projet.metiers.some((link) => link.slug === metier.slug && link.pertinence > 0),
    );
    return {
      metier,
      values: axes.map(
        (axis) =>
          projets.filter((projet) => projet.technologies.some((id) => axis.technologyIds.has(id)))
            .length,
      ),
    };
  });
  const max = Math.max(1, ...series.flatMap((serie) => serie.values));
  return { axes, series, max };
}

function point(index: number, count: number, ratio: number): [number, number] {
  const angle = ((-90 + (index * 360) / count) * Math.PI) / 180;
  return [CENTER + RADIUS * ratio * Math.cos(angle), CENTER + RADIUS * ratio * Math.sin(angle)];
}

const toPoints = (values: number[], max: number) =>
  values
    .map((value, index) => point(index, values.length, value / max))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

/**
 * Carte des compétences : une forme par métier. Choisir un métier (boutons de la légende,
 * qui écrivent ?metier= dans l'adresse) met sa forme en avant et efface les autres.
 */
export function SkillsRadar({ site }: { site: PublicSite }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const [metier, setMetier] = useMetier();
  const ref = useReveal<HTMLDivElement>();
  const { axes, series, max } = radarValues(site);
  if (axes.length < 3 || series.length === 0) return null;

  return (
    <div ref={ref} className="reveal grid items-center gap-8 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('metier.label')}>
          {series.map(({ metier: item }) => {
            const selected = metier === item.slug;
            return (
              <button
                key={item.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => setMetier(selected ? null : item.slug)}
                className={`border-border inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${selected ? 'bg-surface-2 border-fg/40' : 'hover:bg-surface'}`}
              >
                <span
                  className="size-3 rounded"
                  style={{ background: METIER_HEX[item.couleur] }}
                  aria-hidden="true"
                />
                {l(item.nom)}
              </button>
            );
          })}
        </div>
        <p className="text-faint text-sm">{t('skills.radarHint')}</p>
        {/* Équivalent texte du graphique, pour les lecteurs d'écran. */}
        <table className="sr-only">
          <caption>{t('skills.radarCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('skills.domain')}</th>
              {series.map(({ metier: item }) => (
                <th key={item.slug} scope="col">
                  {l(item.nom)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {axes.map((axis, index) => (
              <tr key={axis.key}>
                <th scope="row">{l(axis.label)}</th>
                {series.map(({ metier: item, values }) => (
                  <td key={item.slug}>{t('stats.projects', { count: values[index] })}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <svg
        viewBox={`-60 -20 ${SIZE + 120} ${SIZE + 40}`}
        className="mx-auto w-full max-w-xl overflow-visible"
        aria-hidden="true"
      >
        {[1, 2, 3, 4, 5].map((step) => (
          <polygon
            key={step}
            points={toPoints(
              axes.map(() => step),
              5,
            )}
            fill="none"
            stroke="var(--color-border)"
          />
        ))}
        {axes.map((axis, index) => {
          const [x, y] = point(index, axes.length, 1);
          const [lx, ly] = point(index, axes.length, 1.17);
          const anchor = Math.abs(lx - CENTER) < 20 ? 'middle' : lx > CENTER ? 'start' : 'end';
          return (
            <g key={axis.key}>
              <line x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="var(--color-border)" />
              <text
                x={lx}
                y={ly + 4}
                textAnchor={anchor}
                fontSize={14}
                fontWeight={600}
                fill="var(--color-muted)"
              >
                {l(axis.label)}
              </text>
            </g>
          );
        })}
        {series.map(({ metier: item, values }, index) => {
          const colour = METIER_HEX[item.couleur];
          const dimmed = metier !== null && metier !== item.slug;
          return (
            <g
              key={item.slug}
              className="radar-shape"
              style={
                { '--delay': `${0.3 + index * 0.35}s`, opacity: dimmed ? 0.08 : 1 } as CSSProperties
              }
            >
              <polygon
                points={toPoints(values, max)}
                fill={colour}
                fillOpacity={0.16}
                stroke={colour}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              {values.map((value, axisIndex) => {
                const [x, y] = point(axisIndex, values.length, value / max);
                return <circle key={axisIndex} cx={x} cy={y} r={4} fill={colour} />;
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
