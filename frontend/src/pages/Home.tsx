import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Availability, KeyFigures, Monogram } from '../components/design/ProfileBits';
import { HeroBackdrop } from '../components/design/HeroBackdrop';
import { Reveal } from '../components/design/Reveal';
import { Markdown } from '../components/Markdown';
import { MetierCards } from '../components/MetierCards';
import { MetierPicker } from '../components/MetierPicker';
import { PageSection } from '../components/PageSection';
import { ProjectCard } from '../components/ProjectCard';
import { Timeline } from '../components/Timeline';
import { useSite } from '../lib/content';
import { useLocalized } from '../lib/localized';
import { sortProjects, useMetier, withMetier } from '../lib/metier';
import { usePageSeo } from '../lib/seo';

const FEATURED_COUNT = 3;
const TIMELINE_PREVIEW = 5;

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
      <section className="border-border relative overflow-hidden border-b">
        <HeroBackdrop id="accueil" />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_auto]">
          <div className="space-y-7">
            <div className="space-y-4">
              {l(profil.titre) && (
                <Reveal as="p" className="eyebrow">
                  {l(profil.titre)}
                </Reveal>
              )}
              <Reveal as="h1" delay={0.08} className="text-5xl font-bold sm:text-7xl">
                {profil.nom || t('site.defaultName')}
              </Reveal>
              <Reveal delay={0.16} className="text-muted max-w-2xl text-lg sm:text-xl">
                <Markdown>{l(profil.presentation.accroche)}</Markdown>
              </Reveal>
            </div>
            <Reveal delay={0.24} className="flex flex-wrap gap-3">
              <Link className="btn btn-primary" to={withMetier('/projets', metier)}>
                {t('home.seeProjects')}
              </Link>
              {profil.cv_url && (
                <a
                  className="btn btn-secondary"
                  href={profil.cv_url}
                  target="_blank"
                  rel="noopener"
                >
                  {t('home.cv')}
                </a>
              )}
              <Link className="btn btn-ghost" to={withMetier('/contact', metier)}>
                {t('nav.contact')} →
              </Link>
            </Reveal>
            <Reveal delay={0.32}>
              <MetierPicker metiers={site.metiers} />
            </Reveal>
          </div>
          <Reveal delay={0.25} className="flex flex-col items-center gap-5">
            <Monogram nom={profil.nom} />
            <Availability profil={profil} />
            {l(profil.presentation.localisation) && (
              <p className="text-muted text-sm">{l(profil.presentation.localisation)}</p>
            )}
          </Reveal>
        </div>
      </section>

      {site.metiers.length > 0 && (
        <PageSection eyebrow={t('home.whatIDoEyebrow')} title={t('home.whatIDo')} light>
          <MetierCards site={site} />
        </PageSection>
      )}

      <PageSection
        eyebrow={t('home.featuredEyebrow')}
        title={t('home.featured')}
        aside={
          <Link
            className="text-accent font-semibold hover:underline"
            to={withMetier('/projets', metier)}
          >
            {t('home.allProjects', { count: site.projets.length })} →
          </Link>
        }
      >
        {featured.length === 0 ? (
          <p className="text-muted">{t('projects.empty')}</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-3">
            {featured.map((projet, index) => (
              <Reveal as="li" key={projet.slug} delay={index * 0.1}>
                <ProjectCard projet={projet} headingLevel="h3" />
              </Reveal>
            ))}
          </ul>
        )}
        <div className="mt-12">
          <KeyFigures site={site} />
        </div>
      </PageSection>

      {site.parcours.length > 0 && (
        <PageSection
          eyebrow={t('about.timelineEyebrow')}
          title={t('about.timeline')}
          light
          aside={
            <Link
              className="text-accent font-semibold hover:underline"
              to={withMetier('/a-propos#parcours', metier)}
            >
              {t('home.fullTimeline')} →
            </Link>
          }
        >
          <Timeline entries={site.parcours.slice(0, TIMELINE_PREVIEW)} />
        </PageSection>
      )}
    </>
  );
}
