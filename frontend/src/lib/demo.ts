import type { PublicProjetCard, TypeDemo } from './types';

/** Échelle de preuves (section 4.3 de la conception) : niveau → clé de traduction. */
const LEVEL_KEYS: Record<number, string> = {
  1: 'captures',
  2: 'video',
  3: 'visite',
  4: 'notebook',
  5: 'playground',
  6: 'bac_a_sable',
};

/** Clé de traduction du badge Démo : le niveau le plus élevé disponible. */
export function demoBadgeKey(projet: Pick<PublicProjetCard, 'niveau_demo' | 'types_demo'>): string {
  const key = LEVEL_KEYS[projet.niveau_demo];
  if (key) return key;
  return projet.types_demo.length > 0 ? 'lien_externe' : 'aucune';
}

const YOUTUBE_PATTERN =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/;

/** Adresse d'intégration YouTube (sans cookies), ou null si ce n'est pas une vidéo YouTube. */
export function youtubeEmbedUrl(url: string): string | null {
  const id = YOUTUBE_PATTERN.exec(url)?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function sandboxLoginUrl(loginUrl: string, role: string): string {
  const separator = loginUrl.includes('?') ? '&' : '?';
  return `${loginUrl}${separator}role=${encodeURIComponent(role)}`;
}

export const TOUR_FALLBACK_TYPE: TypeDemo = 'visite';
