import { useTranslation } from 'react-i18next';

import { useLocalized } from '../../lib/localized';
import type { Profil, PublicSite } from '../../lib/types';
import { Reveal } from './Reveal';

/** Initiales du nom (« AYEMOU BAHE » → « AY ») dans un anneau dégradé. */
export function Monogram({ nom, size = 'lg' }: { nom: string; size?: 'md' | 'lg' }) {
  const initials =
    nom
      .replace(/[^\p{L}]/gu, '')
      .slice(0, 2)
      .toUpperCase() || '·';
  const box = size === 'lg' ? 'size-36 text-5xl sm:size-56 sm:text-6xl' : 'size-28 text-4xl';
  return (
    <div className={`monogram-ring rounded-full p-1 ${box}`} aria-hidden="true">
      <div className="bg-surface font-display flex size-full items-center justify-center rounded-full font-bold">
        {initials}
      </div>
    </div>
  );
}

/** Badge vert « Disponible · à partir de … » ; rien si la disponibilité n'est pas renseignée. */
export function Availability({ profil }: { profil: Profil }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const when = l(profil.presentation.disponibilite);
  if (!when) return null;
  return (
    <p className="border-success/60 text-success inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold">
      <span className="bg-success size-2 rounded-full shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-success)_25%,transparent)]" />
      {t('profile.available')} · {when}
    </p>
  );
}

/**
 * Chiffres clés, tous calculés à partir du contenu publié : ils ne peuvent donc
 * jamais contredire la page Projets ou la page Compétences.
 */
export function KeyFigures({ site }: { site: PublicSite }) {
  const { t } = useTranslation();
  const figures = [
    { value: site.projets.length, label: t('stats.publishedProjects') },
    {
      value: site.technologies.filter((item) => item.projets.length > 0).length,
      label: t('stats.skills'),
    },
    {
      value: site.parcours.filter((item) => item.type === 'hackathon' || item.type === 'challenge')
        .length,
      label: t('stats.challenges'),
    },
    { value: site.metiers.length, label: t('stats.metiers') },
  ].filter((figure) => figure.value > 0);
  if (figures.length === 0) return null;
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-4">
      {figures.map((figure, index) => (
        <Reveal
          key={figure.label}
          delay={0.35 + index * 0.1}
          className="border-border flex flex-col-reverse border-r pr-8 last:border-r-0"
        >
          <dt className="text-muted text-sm">{figure.label}</dt>
          <dd className="font-display text-4xl font-bold">{figure.value}</dd>
        </Reveal>
      ))}
    </dl>
  );
}
