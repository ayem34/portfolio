import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocalized } from '../../lib/localized';
import type { PublicDemo } from '../../lib/types';
import {
  ExternalDemoLink,
  NotebookViewer,
  PlaygroundFrame,
  SandboxLauncher,
  VideoPlayer,
} from './players';
import { TourPlayer } from './TourPlayer';

interface DemoPlayerProps {
  /** Démos du projet, la principale en premier (ordre fourni par l'API). */
  demos: PublicDemo[];
  activeId: number;
  onSelect: (demo: PublicDemo) => void;
}

function DemoPanel({
  demo,
  demos,
  onSelect,
}: { demo: PublicDemo } & Omit<DemoPlayerProps, 'activeId'>) {
  switch (demo.type) {
    case 'visite':
      return <TourPlayer etapes={demo.etapes} cadre={demo.config.cadre} />;
    case 'video':
      return <VideoPlayer demo={demo} />;
    case 'notebook':
      return <NotebookViewer demo={demo} />;
    case 'playground':
      return <PlaygroundFrame demo={demo} />;
    case 'bac_a_sable': {
      const tour = demos.find((other) => other.type === 'visite' && other.etapes.length > 0);
      return <SandboxLauncher demo={demo} onShowTour={tour && (() => onSelect(tour))} />;
    }
    case 'lien_externe':
      return <ExternalDemoLink demo={demo} />;
  }
}

/**
 * Lecteur de démos unique : gère tous les types de l'échelle de preuves.
 * La démo la plus interactive est affichée d'abord, les autres en onglets.
 */
export function DemoPlayer({ demos, activeId, onSelect }: DemoPlayerProps) {
  const { t } = useTranslation();
  const l = useLocalized();
  const baseId = useId();
  const active = demos.find((demo) => demo.id === activeId) ?? demos[0];
  if (!active) return null;

  const label = (demo: PublicDemo) => l(demo.config.titre) || t(`enums.type_demo.${demo.type}`);
  const tabId = (demo: PublicDemo) => `${baseId}-tab-${demo.id}`;
  const panelId = `${baseId}-panel`;

  return (
    <div>
      {demos.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label={t('demo.tabs')}>
          {demos.map((demo) => {
            const selected = demo.id === active.id;
            return (
              <button
                key={demo.id}
                id={tabId(demo)}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                className={`btn ${selected ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onSelect(demo)}
              >
                {label(demo)}
              </button>
            );
          })}
        </div>
      )}
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={demos.length > 1 ? tabId(active) : undefined}
      >
        <DemoPanel key={active.id} demo={active} demos={demos} onSelect={onSelect} />
      </div>
    </div>
  );
}
