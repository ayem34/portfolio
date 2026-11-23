/** Appels de l'admin regroupés par module. */

import { api } from '../lib/api';
import type { Media } from '../lib/types';

export const ADMIN = '/admin';

export function uploadMedia(file: File, projetId?: number): Promise<Media> {
  const form = new FormData();
  form.append('fichier', file);
  if (projetId !== undefined) form.append('projet_id', String(projetId));
  return api.post<Media>(`${ADMIN}/medias`, form);
}

/** Importe plusieurs fichiers l'un après l'autre, en gardant leur ordre. */
export async function uploadMedias(files: File[], projetId?: number): Promise<Media[]> {
  const medias: Media[] = [];
  for (const file of files) {
    medias.push(await uploadMedia(file, projetId));
  }
  return medias;
}

export const ACCEPTED_FILES: Record<string, string> = {
  image: '.png,.jpg,.jpeg,.webp,.gif',
  video: '.mp4,.webm',
  pdf: '.pdf',
  notebook: '.html',
  sous_titres: '.vtt',
};
export const ALL_ACCEPTED_FILES = Object.values(ACCEPTED_FILES).join(',');
