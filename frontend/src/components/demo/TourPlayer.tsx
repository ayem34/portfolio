import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { type KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocalized } from '../../lib/localized';
import type { Cadre, EtapeInput } from '../../lib/types';
import { DeviceFrame } from './DeviceFrame';

interface TourPlayerProps {
  etapes: EtapeInput[];
  cadre: Cadre;
}

/**
 * Visite guidée interactive (section 4.4) : le visiteur clique sur la zone mise en
 * évidence pour passer à l'écran suivant. Flèches du clavier, Précédent / Suivant,
 * barre de progression.
 */
export function TourPlayer({ etapes, cadre }: TourPlayerProps) {
  const { t } = useTranslation();
  const l = useLocalized();
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  // Si des étapes sont supprimées dans l'éditeur, on reste sur une étape existante.
  const current = Math.min(index, etapes.length - 1);
  const etape = etapes[current];
  if (!etape) return <p className="text-muted">{t('tour.empty')}</p>;

  const isFirst = current === 0;
  const isLast = current === etapes.length - 1;
  const goTo = (target: number) => setIndex(Math.max(0, Math.min(etapes.length - 1, target)));
  const next = () => goTo(isLast ? 0 : current + 1);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') goTo(current + 1);
    else if (event.key === 'ArrowLeft') goTo(current - 1);
    else return;
    event.preventDefault();
  };

  const caption = l(etape.legende);
  const position = t('tour.step', { current: current + 1, total: etapes.length });

  return (
    <section
      className="focus-visible:outline-accent-strong rounded-xl"
      aria-roledescription={t('tour.roleDescription')}
      aria-label={t('tour.label')}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <DeviceFrame cadre={cadre}>
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={`${current}-${etape.image_url}`}
              src={etape.image_url}
              alt={caption || position}
              className="block h-auto w-full"
              initial={reducedMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
          {etape.zone && (
            <button
              type="button"
              className="tour-hotspot absolute cursor-pointer"
              style={{
                left: `${etape.zone.x}%`,
                top: `${etape.zone.y}%`,
                width: `${etape.zone.largeur}%`,
                height: `${etape.zone.hauteur}%`,
              }}
              onClick={next}
              aria-label={isLast ? t('tour.restart') : t('tour.hotspot')}
            />
          )}
        </div>
      </DeviceFrame>

      <div className="mt-4 space-y-3">
        <p className="min-h-12 text-base" aria-live="polite">
          <span className="text-accent mr-2 text-sm font-semibold">{position}</span>
          {caption}
        </p>
        <div
          className="bg-surface-2 h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-label={t('tour.progress')}
          aria-valuemin={1}
          aria-valuemax={etapes.length}
          aria-valuenow={current + 1}
        >
          <div
            className="bg-accent h-full rounded-full transition-all"
            style={{ width: `${((current + 1) / etapes.length) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => goTo(current - 1)}
            disabled={isFirst}
          >
            {t('tour.previous')}
          </button>
          <button type="button" className="btn btn-primary" onClick={next}>
            {isLast ? t('tour.restart') : t('tour.next')}
          </button>
        </div>
      </div>
    </section>
  );
}
