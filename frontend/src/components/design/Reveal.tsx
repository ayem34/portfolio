import type { CSSProperties, ElementType, ReactNode } from 'react';

import { useReveal } from '../../lib/reveal';

interface RevealProps {
  as?: ElementType;
  /** Décalage en secondes, pour faire apparaître une série d'éléments l'un après l'autre. */
  delay?: number;
  className?: string;
  children: ReactNode;
}

/** Bloc qui apparaît en glissant vers le haut quand il entre à l'écran. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children }: RevealProps) {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ '--delay': `${delay}s` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
