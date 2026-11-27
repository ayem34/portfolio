import type { ReactNode } from 'react';

import { HeroBackdrop } from './design/HeroBackdrop';
import { Reveal } from './design/Reveal';

interface PageSectionProps {
  id?: string;
  title?: string;
  /** Petit sur-titre en capitales au-dessus du titre. */
  eyebrow?: string;
  /** Phrase sous le titre, à droite sur grand écran. */
  aside?: ReactNode;
  light?: boolean;
  /** Fond légèrement plus clair que la page (sections sombres uniquement). */
  raised?: boolean;
  /** Trame de petits points, façon papier millimétré. */
  dotted?: boolean;
  className?: string;
  children: ReactNode;
}

/** Bloc de page ; `light` donne l'alternance de sections claires (sable). */
export function PageSection({
  id,
  title,
  eyebrow,
  aside,
  light = false,
  raised = false,
  dotted = false,
  className = '',
  children,
}: PageSectionProps) {
  const tone = light ? 'section-light' : raised ? 'bg-surface' : '';
  return (
    <section
      id={id}
      className={`relative scroll-mt-20 py-14 sm:py-20 ${tone} ${dotted ? 'dot-grid' : ''} ${className}`}
    >
      <div className="container-page relative">
        {(title || eyebrow) && (
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>}
            </div>
            {aside}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}

interface PageIntroProps {
  /** Identifiant du décor (unique dans la page). */
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
}

/** En-tête sombre d'une page : courbes animées, halo, titre et phrase d'introduction. */
export function PageIntro({ id = 'intro', eyebrow, title, lead, children }: PageIntroProps) {
  return (
    <section className="border-border relative overflow-hidden border-b">
      <HeroBackdrop id={id} />
      <div className="container-page relative space-y-5 pt-14 pb-12 sm:pt-20 sm:pb-16">
        {eyebrow && (
          <Reveal as="p" className="eyebrow">
            {eyebrow}
          </Reveal>
        )}
        <Reveal as="h1" delay={0.08} className="text-4xl font-bold sm:text-6xl">
          {title}
        </Reveal>
        {lead && (
          <Reveal as="p" delay={0.16} className="text-muted max-w-3xl text-lg sm:text-xl">
            {lead}
          </Reveal>
        )}
        {children && <Reveal delay={0.24}>{children}</Reveal>}
      </div>
    </section>
  );
}
