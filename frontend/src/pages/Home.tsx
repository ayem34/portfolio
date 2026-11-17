import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Markdown } from '../components/Markdown';
import { MetierPicker } from '../components/MetierPicker';
import { PageSection } from '../components/PageSection';
import { ProjectCard } from '../components/ProjectCard';
import { useSite } from '../lib/content';
import { useLocalized } from '../lib/localized';
import { sortProjects, useMetier, withMetier } from '../lib/metier';
import { usePageSeo } from '../lib/seo';

const FEATURED_COUNT = 3;

export default function Home() {
  const { t } = useTranslation();
  const l = useLocalized();
  const { data: site } = useSite();
  const [metier] = useMetier();
  usePageSeo('home', site);
  if (!site) return null;

  const { profil } = site;
  const featured = sortProjects(
    site.projets.filter((projet) => projet.est_phare),
    metier,
  ).slice(0, FEATURED_COUNT);

  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container-page space-y-8">
          <div className="space-y-4">
            {l(profil.titre) && <p className="eyebrow">{l(profil.titre)}</p>}
            <h1 className="text-5xl font-bold sm:text-7xl">
              {profil.nom || t('site.defaultName')}
            </h1>
            <div className="text-muted max-w-2xl text-lg sm:text-xl">
              <Markdown>{l(profil.presentation.accroche)}</Markdown>
            </div>
          </div>
          <MetierPicker metiers={site.metiers} />
          <div className="flex flex-wrap gap-3">
            <Link className="btn btn-primary" to={withMetier('/projets', metier)}>
              {t('nav.projects')}
            </Link>
            {profil.cv_url && (
              <a className="btn btn-secondary" href={profil.cv_url} target="_blank" rel="noopener">
                {t('home.cv')}
              </a>
            )}
            <Link className="btn btn-secondary" to={withMetier('/contact', metier)}>
              {t('nav.contact')}
            </Link>
          </div>
        </div>
      </section>

      <PageSection title={t('home.featured')} light>
        {featured.length === 0 ? (
          <p className="text-muted">{t('projects.empty')}</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-3">
            {featured.map((projet) => (
              <li key={projet.slug}>
                <ProjectCard projet={projet} headingLevel="h3" />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8">
          <Link className="btn btn-secondary" to={withMetier('/projets', metier)}>
            {t('home.allProjects')}
          </Link>
        </p>
      </PageSection>
    </>
  );
}
