import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useSite } from '../lib/content';
import { useLocalized } from '../lib/localized';
import { useMetier, withMetier } from '../lib/metier';
import { metierClass } from '../lib/metierStyle';
import type { PublicProjetCard } from '../lib/types';
import { MetierFigure } from './design/MetierFigure';
import { ProjectBadges } from './ProjectBadges';

interface ProjectCardProps {
  projet: PublicProjetCard;
  /** Niveau du titre dans la page (h2 par défaut). */
  headingLevel?: 'h2' | 'h3';
}

const STACK_SHOWN = 4;

export function ProjectCard({ projet, headingLevel: Heading = 'h2' }: ProjectCardProps) {
  const { t } = useTranslation();
  const l = useLocalized();
  const [metier] = useMetier();
  const { data: site } = useSite();
  const names = new Map(site?.technologies.map((item) => [item.id, item.nom]));
  const stack = projet.technologies.flatMap((id) => names.get(id) ?? []).slice(0, STACK_SHOWN);
  // Sans capture, la carte reprend la figure du métier principal du projet.
  const mainMetier = site?.metiers.find((item) => item.slug === projet.metiers[0]?.slug);

  return (
    <article className="card group hover:border-accent relative flex h-full flex-col overflow-hidden shadow-sm transition-[transform,border-color,box-shadow] hover:-translate-y-1 hover:shadow-lg">
      {projet.image ? (
        <div className="border-border overflow-hidden border-b">
          <img
            src={projet.image}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div
          className={`${metierClass(mainMetier?.couleur)} border-border bg-surface-2 flex aspect-video w-full items-center border-b p-6`}
        >
          <div className="w-full">
            <MetierFigure figure={mainMetier?.figure ?? 'application'} />
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-muted text-xs font-semibold tracking-wider uppercase">
          {t(`enums.categorie.${projet.categorie}`)}
        </p>
        <Heading className="text-xl font-semibold">
          {/* Le lien couvre toute la carte (after:absolute) : une seule cible, bien nommée. */}
          <Link
            to={withMetier(`/projets/${projet.slug}`, metier)}
            className="after:absolute after:inset-0"
          >
            {l(projet.titre)}
          </Link>
        </Heading>
        <p className="text-muted flex-1">{l(projet.resume)}</p>
        {stack.length > 0 && <p className="text-sm font-semibold">{stack.join(' · ')}</p>}
        <ProjectBadges projet={projet} />
      </div>
    </article>
  );
}
