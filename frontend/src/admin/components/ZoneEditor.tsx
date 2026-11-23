import { type PointerEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Zone } from '../../lib/types';
import {
  clampZone,
  isZoneLargeEnough,
  type Point,
  pointToPercent,
  zoneFromPoints,
} from '../../lib/zone';

interface ZoneEditorProps {
  imageUrl: string;
  alt: string;
  zone: Zone | null;
  onChange: (zone: Zone | null) => void;
}

const ZONE_FIELDS = ['x', 'y', 'largeur', 'hauteur'] as const;
const DEFAULT_ZONE: Zone = { x: 40, y: 40, largeur: 20, hauteur: 12 };

/**
 * Tracé de la zone cliquable d'une étape : on dessine un rectangle à la souris
 * (ou au doigt) sur la capture. Les coordonnées sont en % de l'image.
 * Les quatre champs numériques permettent le même réglage au clavier.
 */
export function ZoneEditor({ imageUrl, alt, zone, onChange }: ZoneEditorProps) {
  const { t } = useTranslation();
  const surface = useRef<HTMLDivElement>(null);
  const start = useRef<Point | null>(null);
  const [draft, setDraft] = useState<Zone | null>(null);

  const pointFromEvent = (event: PointerEvent): Point | null => {
    const box = surface.current?.getBoundingClientRect();
    return box ? pointToPercent(event.clientX, event.clientY, box) : null;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const point = pointFromEvent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = point;
    setDraft(zoneFromPoints(point, point));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const point = pointFromEvent(event);
    if (start.current && point) setDraft(zoneFromPoints(start.current, point));
  };

  const onPointerUp = () => {
    if (draft && isZoneLargeEnough(draft)) onChange(draft);
    start.current = null;
    setDraft(null);
  };

  const shown = draft ?? zone;

  return (
    <div className="space-y-3">
      <p className="text-muted text-sm">{t('admin.tour.drawHint')}</p>
      <div
        ref={surface}
        className="border-border relative mx-auto w-fit cursor-crosshair touch-none overflow-hidden rounded-lg border select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-testid="zone-surface"
      >
        {/* Hauteur limitée : une capture de téléphone reste entièrement visible à l'écran. */}
        <img
          src={imageUrl}
          alt={alt}
          className="block h-auto max-h-[70vh] w-auto max-w-full"
          draggable={false}
        />
        {shown && (
          <div
            className="border-accent bg-accent/25 pointer-events-none absolute rounded border-2"
            style={{
              left: `${shown.x}%`,
              top: `${shown.y}%`,
              width: `${shown.largeur}%`,
              height: `${shown.hauteur}%`,
            }}
            data-testid="zone-rectangle"
          />
        )}
      </div>

      <fieldset className="flex flex-wrap items-end gap-3">
        <legend className="field-label">{t('admin.tour.zoneCoordinates')}</legend>
        {ZONE_FIELDS.map((field) => (
          <label key={field} className="text-sm">
            <span className="text-muted mb-1 block">{t(`admin.tour.zone.${field}`)}</span>
            <input
              type="number"
              className="field w-24"
              min={0}
              max={100}
              step={0.5}
              value={zone?.[field] ?? ''}
              onChange={(event) =>
                onChange(
                  clampZone({ ...(zone ?? DEFAULT_ZONE), [field]: Number(event.target.value) }),
                )
              }
            />
          </label>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onChange(null)}
          disabled={!zone}
        >
          {t('admin.tour.clearZone')}
        </button>
      </fieldset>
    </div>
  );
}
