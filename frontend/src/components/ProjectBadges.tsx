import { useTranslation } from 'react-i18next';

import { demoBadgeKey } from '../lib/demo';
import type { AccesCode, Etat, PublicProjetCard } from '../lib/types';
import { Badge, type BadgeTone } from './Badge';

const CODE_TONES: Record<AccesCode, BadgeTone> = {
  public: 'success',
  prive: 'neutral',
  confidentiel: 'warning',
};
const ETAT_TONES: Record<Etat, BadgeTone> = {
  termine: 'success',
  en_cours: 'info',
  prototype: 'neutral',
};

type BadgeFields = Pick<PublicProjetCard, 'acces_code' | 'etat' | 'niveau_demo' | 'types_demo'>;

/** Les 3 badges indépendants d'un projet : Code, État, Démo (section 4.2). */
export function ProjectBadges({ projet }: { projet: BadgeFields }) {
  const { t } = useTranslation();
  const demoKey = demoBadgeKey(projet);
  return (
    <ul className="flex flex-wrap gap-2" aria-label={t('badges.label')}>
      <li>
        <Badge tone={CODE_TONES[projet.acces_code]} label={t('badges.code')}>
          {t(`enums.acces_code.${projet.acces_code}`)}
        </Badge>
      </li>
      <li>
        <Badge tone={ETAT_TONES[projet.etat]} label={t('badges.etat')}>
          {t(`enums.etat.${projet.etat}`)}
        </Badge>
      </li>
      <li>
        <Badge tone={demoKey === 'aucune' ? 'neutral' : 'accent'} label={t('badges.demo')}>
          {t(`badges.demoLevel.${demoKey}`)}
        </Badge>
      </li>
    </ul>
  );
}
