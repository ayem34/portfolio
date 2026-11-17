import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Badge } from '../components/Badge';
import { MetierPicker } from '../components/MetierPicker';
import { PageIntro, PageSection } from '../components/PageSection';
import { useSite } from '../lib/content';
import { useLocalized } from '../lib/localized';
import { sortTechnologies, useMetier, withMetier } from '../lib/metier';
import { usePageSeo } from '../lib/seo';
import type { PublicTechnologie } from '../lib/types';

/** Compétences groupées par domaine, avec leur niveau et les projets qui les prouvent. */
export default function Skills() {
  const { t } = useTranslation();
  const l = useLocalized();
  const { data: site } = useSite();
  const [metier] = useMetier();
  usePageSeo('skills', site);
  if (!site) return null;

  const titles = new Map(site.projets.map((projet) => [projet.slug, projet.titre]));
  // L'ordre des domaines suit celui des compétences : avec un métier choisi,
  // les domaines les plus pertinents remontent donc en tête.
  const groups = new Map<string, PublicTechnologie[]>();
  for (const technologie of sortTechnologies(site.technologies, site.projets, metier)) {
    const group = groups.get(technologie.domaine.fr) ?? [];
    group.push(technologie);
    groups.set(technologie.domaine.fr, group);
  }

  return (
    <>
      <PageIntro title={t('nav.skills')} lead={t('skills.lead')} />
      <div className="container-page pb-8">
        <MetierPicker metiers={site.metiers} />
      </div>
      {groups.size === 0 && (
        <PageSection light>
          <p className="text-muted">{t('common.comingSoon')}</p>
        </PageSection>
      )}
      {[...groups.values()].map((technologies, index) => (
        <PageSection
          key={technologies[0]?.id}
          title={l(technologies[0]?.domaine)}
          light={index % 2 === 0}
        >
          <ul className="grid gap-4 md:grid-cols-2">
            {technologies.map((technologie) => (
              <li
                key={technologie.id}
                id={`competence-${technologie.id}`}
                className="card scroll-mt-24 space-y-3 p-5 target:border-accent"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{technologie.nom}</h3>
                  <Badge tone="accent">{t(`enums.niveau.${technologie.niveau}`)}</Badge>
                </div>
                {technologie.projets.length === 0 ? (
                  <p className="text-muted text-sm">{t('skills.noProject')}</p>
                ) : (
                  <>
                    <p className="text-muted text-sm">
                      {t('skills.usedIn', { count: technologie.projets.length })}
                    </p>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {technologie.projets.map((slug) => (
                        <li key={slug}>
                          <Link
                            className="text-accent underline underline-offset-4"
                            to={withMetier(`/projets/${slug}`, metier)}
                          >
                            {l(titles.get(slug))}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ul>
        </PageSection>
      ))}
    </>
  );
}
