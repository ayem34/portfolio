import { useTranslation } from 'react-i18next';

import { PageIntro, PageSection } from '../components/PageSection';
import { LearningList } from '../components/skills/LearningList';
import { SkillsMatrix } from '../components/skills/SkillsMatrix';
import { SkillsRadar } from '../components/skills/SkillsRadar';
import { useSite } from '../lib/content';
import { usePageSeo } from '../lib/seo';

/**
 * Compétences : carte par métier (radar), matrice compétences × projets,
 * puis ce qui est en cours d'apprentissage. Tout est calculé à partir des projets publiés.
 */
export default function Skills() {
  const { t } = useTranslation();
  const { data: site } = useSite();
  usePageSeo('skills', site);
  if (!site) return null;
  const learning = site.technologies.filter((item) => item.projets.length === 0);
  const proven = site.technologies.length - learning.length;

  return (
    <>
      <PageIntro
        id="competences"
        eyebrow={t('nav.skills')}
        title={t('skills.title')}
        lead={t('skills.lead')}
      >
        <SkillsRadar site={site} />
      </PageIntro>
      {proven > 0 && (
        <PageSection
          light
          eyebrow={t('skills.matrixEyebrow')}
          title={t('skills.matrixTitle')}
          aside={<p className="text-muted max-w-sm text-sm">{t('skills.matrixHint')}</p>}
        >
          <SkillsMatrix site={site} />
        </PageSection>
      )}
      {learning.length > 0 && (
        <PageSection
          dotted
          eyebrow={t('skills.learningEyebrow')}
          title={t('skills.learningTitle')}
          aside={<p className="text-muted max-w-sm text-sm">{t('skills.learningHint')}</p>}
        >
          <LearningList technologies={learning} />
        </PageSection>
      )}
      {site.technologies.length === 0 && (
        <PageSection light>
          <p className="text-muted">{t('common.comingSoon')}</p>
        </PageSection>
      )}
    </>
  );
}
