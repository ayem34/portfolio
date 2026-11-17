import type { TypeDemo } from './types';

interface ConsultationEvent {
  slug: string;
  type_demo?: TypeDemo | 'captures';
  metier_choisi?: string | null;
}

/**
 * Enregistre une vue de fiche ou un lancement de démo (statistiques de l'admin).
 * Jamais bloquant : si l'API dort, la statistique est simplement perdue.
 */
export function recordConsultation(event: ConsultationEvent): void {
  void fetch('/api/public/consultations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => undefined);
}
