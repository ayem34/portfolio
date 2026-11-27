import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Reveal } from '../components/design/Reveal';
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

type SortKey = 'ordre' | 'recent';

/** « Recommandés » garde l'ordre choisi dans l'admin ; « Plus récents » suit la date de publication. */
export function sortByKey(projets: PublicProjetCard[], key: SortKey): PublicProjetCard[] {
  if (key === 'ordre') return projets;
  return [...projets].sort((a, b) =>
    (b.date_publication ?? '').localeCompare(a.date_publication ?? ''),
  );
}

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
  /** Sans option « Tous » (pour le tri). */
  required?: boolean;
}

function FilterSelect({ label, value, onChange, options, required = false }: FilterSelectProps) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {!required && <option value="">{t('projects.filters.all')}</option>}
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
  const [sortKey, setSortKey] = useState<SortKey>('ordre');
  usePageSeo('projects', site);
  if (!site) return null;

  const set = (key: keyof Filters) => (value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  // Seuls les domaines, technologies et types de démo réellement présents sont proposés.
  const usedTechnologies = site.technologies.filter((item) => item.projets.length > 0);
  const domains = [...new Map(usedTechnologies.map((item) => [item.domaine.fr, item.domaine]))];
  const demoTypes = [...new Set(site.projets.flatMap((projet) => projet.types_demo))];
  const shown = sortByKey(
    sortProjects(filterProjects(site.projets, site.technologies, filters), metier),
    sortKey,
  );
  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <PageIntro id="projets" title={t('nav.projects')} lead={t('projects.lead')}>
        <MetierPicker metiers={site.metiers} />
      </PageIntro>
      <PageSection light>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              options={usedTechnologies.map((item) => ({
                value: String(item.id),
                label: item.nom,
              }))}
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
          <div className="flex flex-wrap items-end gap-4">
            <FilterSelect
              label={t('projects.sort.label')}
              value={sortKey}
              onChange={(value) => setSortKey(value === 'recent' ? 'recent' : 'ordre')}
              options={[
                { value: 'ordre', label: t('projects.sort.ordre') },
                { value: 'recent', label: t('projects.sort.recent') },
              ]}
              required
            />
            <p className="text-muted pb-3 text-sm" role="status">
              {t('projects.count', { count: shown.length })}
            </p>
            {filtered && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setFilters(NO_FILTERS)}
              >
                {t('projects.filters.reset')}
              </button>
            )}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="text-muted">{t(filtered ? 'projects.noMatch' : 'projects.empty')}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((projet, index) => (
              <Reveal as="li" key={projet.slug} delay={(index % 3) * 0.08}>
                <ProjectCard projet={projet} />
              </Reveal>
            ))}
          </ul>
        )}
      </PageSection>
    </>
  );
}
