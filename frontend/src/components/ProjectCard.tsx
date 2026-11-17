import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLocalized } from '../lib/localized';
import { useMetier, withMetier } from '../lib/metier';
import type { PublicProjetCard } from '../lib/types';
import { ProjectBadges } from './ProjectBadges';

interface ProjectCardProps {
  projet: PublicProjetCard;
  /** Niveau du titre dans la page (h2 par défaut). */
  headingLevel?: 'h2' | 'h3';
}

export function ProjectCard({ projet, headingLevel: Heading = 'h2' }: ProjectCardProps) {
  const { t } = useTranslation();
  const l = useLocalized();
  const [metier] = useMetier();
  return (
    <article className="card hover:border-accent relative flex h-full flex-col overflow-hidden transition-colors">
      {projet.image ? (
        <img
          src={projet.image}
          alt=""
          loading="lazy"
          className="border-border aspect-video w-full border-b object-cover"
        />
      ) : (
        <div
          className="border-border bg-surface-2 text-accent font-display flex aspect-video w-full items-center justify-center border-b text-4xl font-bold"
          aria-hidden="true"
        >
          {l(projet.titre).slice(0, 1)}
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
        <ProjectBadges projet={projet} />
      </div>
    </article>
  );
}
