import { type RefObject, useEffect, useRef } from 'react';

/**
 * Ajoute la classe `is-shown` à l'élément quand il arrive à l'écran (une seule fois) :
 * les animations CSS (.reveal, figures, barres…) se jouent à ce moment-là,
 * et non au chargement de la page, sinon le visiteur raterait tout ce qui est plus bas.
 */
export function useReveal<T extends Element>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-shown');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-shown');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return ref;
}
