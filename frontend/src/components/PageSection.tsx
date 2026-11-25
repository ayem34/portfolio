import type { ReactNode } from 'react';

interface PageSectionProps {
  id?: string;
  title?: string;
  light?: boolean;
  children: ReactNode;
}

/** Bloc de page ; `light` donne l'alternance de sections claires. */
export function PageSection({ id, title, light = false, children }: PageSectionProps) {
  return (
    <section id={id} className={`scroll-mt-20 py-12 sm:py-16 ${light ? 'section-light' : ''}`}>
      <div className="container-page">
        {title && <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{title}</h2>}
        {children}
      </div>
    </section>
  );
}

export function PageIntro({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="container-page pt-12 pb-8 sm:pt-16">
      <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
      {lead && <p className="text-muted mt-4 max-w-3xl text-lg">{lead}</p>}
    </div>
  );
}
