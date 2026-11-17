import type { Zone } from './types';

export interface Point {
  x: number;
  y: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Plus petite zone acceptée, en % de l'image : en dessous, c'est un clic accidentel. */
export const MIN_ZONE_SIZE = 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;

/** Position du pointeur en % de l'image (0–100), quelle que soit sa taille à l'écran. */
export function pointToPercent(clientX: number, clientY: number, box: Box): Point {
  if (box.width === 0 || box.height === 0) return { x: 0, y: 0 };
  return {
    x: clamp(((clientX - box.left) / box.width) * 100, 0, 100),
    y: clamp(((clientY - box.top) / box.height) * 100, 0, 100),
  };
}

/** Rectangle défini par deux coins opposés, dans n'importe quel sens de tracé. */
export function zoneFromPoints(start: Point, end: Point): Zone {
  return {
    x: round(Math.min(start.x, end.x)),
    y: round(Math.min(start.y, end.y)),
    largeur: round(Math.abs(end.x - start.x)),
    hauteur: round(Math.abs(end.y - start.y)),
  };
}

export function isZoneLargeEnough(zone: Zone): boolean {
  return zone.largeur >= MIN_ZONE_SIZE && zone.hauteur >= MIN_ZONE_SIZE;
}

/** Ramène une zone saisie au clavier à l'intérieur de l'image. */
export function clampZone(zone: Zone): Zone {
  const largeur = clamp(zone.largeur, MIN_ZONE_SIZE, 100);
  const hauteur = clamp(zone.hauteur, MIN_ZONE_SIZE, 100);
  return {
    x: round(clamp(zone.x, 0, 100 - largeur)),
    y: round(clamp(zone.y, 0, 100 - hauteur)),
    largeur: round(largeur),
    hauteur: round(hauteur),
  };
}
