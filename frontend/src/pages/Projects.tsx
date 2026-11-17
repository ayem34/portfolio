import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MetierPicker } from '../components/MetierPicker';
import { PageIntro, PageSection } from '../components/PageSection';
import { ProjectCard } from '../components/ProjectCard';
import { useSite } from '../lib/content';
import { useLocalized } from '../lib/localized';
import { sortProjects, useMetier } from '../lib/metier';
import { usePageSeo } from '../lib/seo';
import { CATEGORIES, type PublicProjetCard, type PublicSite } from '../lib/types';

interface Filters {
  domaine: string;
  technologie: string;
  demo: string;
  categorie: string;
}
const NO_FILTERS: Filters = { domaine: '', technologie: '', demo: '', categorie: '' };

/** Filtres secondaires : domaine, technologie, type de démo, catégorie. */
export function filterProjects(
  projets: PublicProjetCard[],
  technologies: PublicSite['technologies'],
  filters: Filters,
): PublicProjetCard[] {
  const domainIds = new Set(
    technologies.filter((item) => item.domaine.fr === filters.domaine).map((item) => item.id),
  );
  return projets.filter(
    (projet) =>
      (!filters.domaine || projet.technologies.some((id) => domainIds.has(id))) &&
      (!filters.technologie || projet.technologies.includes(Number(filters.technologie))) &&
      (!filters.demo || projet.types_demo.some((type) => type === filters.demo)) &&
      (!filters.categorie || projet.categorie === filters.categorie),
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('projects.filters.all')}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Projects() {
  const { t } = useTranslation();
  const l = useLocalized();
  const { data: site } = useSite();
  const [metier] = useMetier();
  const [filters, setFilters] = useState(NO_FILTERS);
  usePageSeo('projects', site);
  if (!site) return null;

  const set = (key: keyof Filters) => (value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  // Seuls les domaines, technologies et types de démo réellement présents sont proposés.
  const usedTechnologies = site.technologies.filter((item) => item.projets.length > 0);
  const domains = [...new Map(usedTechnologies.map((item) => [item.domaine.fr, item.domaine]))];
  const demoTypes = [...new Set(site.projets.flatMap((projet) => projet.types_demo))];
  const shown = sortProjects(filterProjects(site.projets, site.technologies, filters), metier);
  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <PageIntro title={t('nav.projects')} lead={t('projects.lead')} />
      <div className="container-page space-y-6 pb-8">
        <MetierPicker metiers={site.metiers} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label={t('projects.filters.domain')}
            value={filters.domaine}
            onChange={set('domaine')}
            options={domains.map(([key, domaine]) => ({ value: key, label: l(domaine) }))}
          />
          <FilterSelect
            label={t('projects.filters.technology')}
            value={filters.technologie}
            onChange={set('technologie')}
            options={usedTechnologies.map((item) => ({ value: String(item.id), label: item.nom }))}
          />
          <FilterSelect
            label={t('projects.filters.demo')}
            value={filters.demo}
            onChange={set('demo')}
            options={demoTypes.map((type) => ({
              value: type,
              label: t(`enums.type_demo.${type}`),
            }))}
          />
          <FilterSelect
            label={t('projects.filters.category')}
            value={filters.categorie}
            onChange={set('categorie')}
            options={CATEGORIES.map((value) => ({
              value,
              label: t(`enums.categorie.${value}`),
            }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-muted text-sm" role="status">
            {t('projects.count', { count: shown.length })}
          </p>
          {filtered && (
            <button type="button" className="btn btn-ghost" onClick={() => setFilters(NO_FILTERS)}>
              {t('projects.filters.reset')}
            </button>
          )}
        </div>
      </div>
      <PageSection light>
        {shown.length === 0 ? (
          <p className="text-muted">{t(filtered ? 'projects.noMatch' : 'projects.empty')}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((projet) => (
              <li key={projet.slug}>
                <ProjectCard projet={projet} />
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </>
  );
}
