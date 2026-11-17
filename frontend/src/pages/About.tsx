import { useTranslation } from 'react-i18next';

import { Markdown } from '../components/Markdown';
import { PageIntro, PageSection } from '../components/PageSection';
import { Timeline } from '../components/Timeline';
import { useSite } from '../lib/content';
import { useLocalized } from '../lib/localized';
import { usePageSeo } from '../lib/seo';

export default function About() {
  const { t } = useTranslation();
  const l = useLocalized();
  const { data: site } = useSite();
  usePageSeo('about', site);
  if (!site) return null;
  const { presentation } = site.profil;

  return (
    <>
      <PageIntro title={t('nav.about')} lead={l(site.profil.titre)} />
      {l(presentation.profil) && (
        <PageSection title={t('about.profile')} light>
          <div className="max-w-3xl">
            <Markdown>{l(presentation.profil)}</Markdown>
          </div>
        </PageSection>
      )}
      {l(presentation.orientation) && (
        <PageSection title={t('about.direction')}>
          <div className="max-w-3xl">
            <Markdown>{l(presentation.orientation)}</Markdown>
          </div>
        </PageSection>
      )}
      {l(presentation.methode) && (
        <PageSection title={t('project.howIWork')} light>
          <div className="max-w-3xl">
            <Markdown>{l(presentation.methode)}</Markdown>
          </div>
        </PageSection>
      )}
      <PageSection title={t('about.timeline')}>
        {site.parcours.length === 0 ? (
          <p className="text-muted">{t('common.comingSoon')}</p>
        ) : (
          <Timeline entries={site.parcours} />
        )}
      </PageSection>
    </>
  );
}
