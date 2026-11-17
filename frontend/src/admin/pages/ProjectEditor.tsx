import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { type Resolver, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { Badge } from '../../components/Badge';
import { api } from '../../lib/api';
import { EMPTY_TEXT, useLocalized } from '../../lib/localized';
import {
  ACCES_CODES,
  CATEGORIES,
  ETATS,
  LIEN_KEYS,
  METHODE_KEYS,
  type Metier,
  type Projet,
  type ProjetInput,
  type StatutPublication,
  type Technologie,
} from '../../lib/types';
import { ADMIN } from '../api';
import {
  BilingualField,
  CheckboxField,
  FormSection,
  PageHeader,
  QueryState,
  SelectField,
  TextField,
} from '../components/form';
import { useAdminMutation, useAdminQuery } from '../hooks';
import { EMPTY_PROJECT, slugify, toProjectInput } from '../project';
import { DemosTab } from './project/DemosTab';
import { GalleryTab } from './project/GalleryTab';
import { HistoryTab } from './project/HistoryTab';
import { STATUS_TONES } from './ProjectList';

const TABS = ['general', 'contenu', 'galerie', 'demos', 'historique'] as const;
type Tab = (typeof TABS)[number];
const FORM_TABS: Tab[] = ['general', 'contenu'];
const FORM_ID = 'project-form';

// Seules les règles utiles à l'affichage d'erreurs sont vérifiées ici ;
// l'API valide tout le reste.
const schema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    titre: z.object({ fr: z.string().trim().min(1), en: z.string() }),
  })
  .passthrough();

interface ProjectFormProps {
  projet: Projet | null;
  tab: Tab;
  onSaved: (projet: Projet) => void;
}

function ProjectForm({ projet, tab, onSaved }: ProjectFormProps) {
  const { t } = useTranslation();
  const l = useLocalized();
  const metiers = useAdminQuery('/metiers', () => api.get<Metier[]>(`${ADMIN}/metiers`));
  const technologies = useAdminQuery('/technologies', () =>
    api.get<Technologie[]>(`${ADMIN}/technologies`),
  );

  const { register, handleSubmit, watch, setValue, reset, control, formState } =
    useForm<ProjetInput>({
      defaultValues: projet ? toProjectInput(projet) : EMPTY_PROJECT,
      // Le schéma ne décrit qu'une partie des champs (passthrough) : son type est plus
      // large que ProjetInput, d'où cette conversion.
      resolver: zodResolver(schema) as unknown as Resolver<ProjetInput>,
    });
  const figures = useFieldArray({ control, name: 'contenu.chiffres' });
  const { errors, dirtyFields, isDirty } = formState;

  const save = useAdminMutation(
    (data: ProjetInput) =>
      projet
        ? api.put<Projet>(`${ADMIN}/projets/${projet.id}`, data)
        : api.post<Projet>(`${ADMIN}/projets`, data),
    {
      onSuccess: (saved) => {
        reset(toProjectInput(saved));
        onSaved(saved);
      },
    },
  );

  // Nouveau projet : l'adresse (slug) suit le titre tant qu'elle n'a pas été modifiée à la main.
  const titleFr = watch('titre.fr');
  useEffect(() => {
    if (!projet && !dirtyFields.slug) setValue('slug', slugify(titleFr));
  }, [projet, dirtyFields.slug, titleFr, setValue]);

  const metierLinks = watch('metiers');
  const technologyIds = watch('technologie_ids');
  const domains = [...new Set((technologies.data ?? []).map((item) => item.domaine.fr))];

  return (
    <form
      id={FORM_ID}
      className="space-y-6"
      onSubmit={handleSubmit((data) => save.mutate(data))}
      noValidate
    >
      {isDirty && (
        <p className="text-warning text-sm" role="status">
          {t('admin.unsavedChanges')}
        </p>
      )}

      <div hidden={tab !== 'general'} className="space-y-6">
        <FormSection title={t('admin.project.identity')}>
          <BilingualField
            label={t('admin.project.title')}
            name="titre"
            register={register}
            error={errors.titre?.fr && t('admin.project.titleRequired')}
          />
          <TextField
            label={t('admin.project.slug')}
            hint={t('admin.project.slugHint')}
            error={errors.slug && t('admin.project.slugInvalid')}
            {...register('slug')}
          />
          <BilingualField
            label={t('admin.project.summary')}
            name="resume"
            register={register}
            multiline
            rows={2}
          />
        </FormSection>

        <FormSection title={t('admin.project.classification')}>
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label={t('admin.project.category')} {...register('categorie')}>
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {t(`enums.categorie.${value}`)}
                </option>
              ))}
            </SelectField>
            <SelectField label={t('badges.etat')} {...register('etat')}>
              {ETATS.map((value) => (
                <option key={value} value={value}>
                  {t(`enums.etat.${value}`)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={t('badges.code')}
              hint={t('admin.project.codeHint')}
              {...register('acces_code')}
            >
              {ACCES_CODES.map((value) => (
                <option key={value} value={value}>
                  {t(`enums.acces_code.${value}`)}
                </option>
              ))}
            </SelectField>
          </div>
          <CheckboxField label={t('admin.project.featuredLabel')} {...register('est_phare')} />
        </FormSection>

        <FormSection title={t('admin.project.metiers')}>
          <p className="text-muted text-sm">{t('admin.project.metiersHint')}</p>
          <ul className="space-y-2">
            {(metiers.data ?? []).map((metier) => {
              const link = metierLinks.find((item) => item.metier_id === metier.id);
              const others = metierLinks.filter((item) => item.metier_id !== metier.id);
              const update = (next: typeof metierLinks) =>
                setValue('metiers', next, { shouldDirty: true });
              return (
                <li key={metier.id} className="flex flex-wrap items-center gap-4">
                  <CheckboxField
                    label={l(metier.nom)}
                    checked={Boolean(link)}
                    onChange={(event) =>
                      update(
                        event.target.checked
                          ? [...others, { metier_id: metier.id, pertinence: 2 }]
                          : others,
                      )
                    }
                  />
                  {link && (
                    <select
                      className="field w-auto"
                      aria-label={t('admin.project.relevanceFor', { metier: l(metier.nom) })}
                      value={link.pertinence}
                      onChange={(event) =>
                        update([
                          ...others,
                          { metier_id: metier.id, pertinence: Number(event.target.value) },
                        ])
                      }
                    >
                      {[3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {t(`admin.project.relevance.${value}`)}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              );
            })}
          </ul>
        </FormSection>

        <FormSection title={t('project.technologies')}>
          {domains.length === 0 ? (
            <p className="text-muted text-sm">
              {t('admin.project.noTechnologies')}{' '}
              <Link className="text-accent underline" to="/admin/competences">
                {t('admin.nav.skills')}
              </Link>
            </p>
          ) : (
            domains.map((domain) => (
              <fieldset key={domain}>
                <legend className="text-muted mb-1 text-sm font-semibold">{domain}</legend>
                <div className="flex flex-wrap gap-x-6">
                  {(technologies.data ?? [])
                    .filter((item) => item.domaine.fr === domain)
                    .map((item) => (
                      <CheckboxField
                        key={item.id}
                        label={item.nom}
                        checked={technologyIds.includes(item.id)}
                        onChange={(event) =>
                          setValue(
                            'technologie_ids',
                            event.target.checked
                              ? [...technologyIds, item.id]
                              : technologyIds.filter((id) => id !== item.id),
                            { shouldDirty: true },
                          )
                        }
                      />
                    ))}
                </div>
              </fieldset>
            ))
          )}
        </FormSection>
      </div>

      <div hidden={tab !== 'contenu'} className="space-y-6">
        <p className="text-muted text-sm">{t('admin.markdownHint')}</p>
        <FormSection title={t('project.context')}>
          <BilingualField
            label={t('project.context')}
            name="contenu.contexte"
            register={register}
            multiline
            rows={6}
          />
        </FormSection>

        <FormSection title={t('project.goalsAndResults')}>
          <BilingualField
            label={t('project.goals')}
            name="contenu.objectifs"
            register={register}
            multiline
            rows={5}
          />
          <BilingualField
            label={t('project.results')}
            name="contenu.resultats"
            register={register}
            multiline
            rows={5}
          />
          <fieldset className="space-y-3">
            <legend className="field-label">{t('admin.project.figures')}</legend>
            <p className="text-muted text-sm">{t('admin.project.figuresHint')}</p>
            {figures.fields.map((field, index) => (
              <div key={field.id} className="border-border space-y-3 rounded-lg border p-3">
                <TextField
                  label={t('admin.project.figureValue')}
                  {...register(`contenu.chiffres.${index}.valeur`)}
                />
                <BilingualField
                  label={t('admin.project.figureLabel')}
                  name={`contenu.chiffres.${index}.libelle`}
                  register={register}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => figures.remove(index)}
                >
                  {t('admin.delete')}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => figures.append({ valeur: '', libelle: EMPTY_TEXT })}
            >
              {t('admin.project.addFigure')}
            </button>
          </fieldset>
        </FormSection>

        <FormSection title={t('project.howIWork')}>
          {METHODE_KEYS.map((key) => (
            <BilingualField
              key={key}
              label={t(`project.method.${key}`)}
              name={`contenu.methode.${key}`}
              register={register}
              multiline
              rows={5}
            />
          ))}
        </FormSection>

        <FormSection title={t('project.challengesAndLearnings')}>
          <BilingualField
            label={t('project.challenges')}
            name="contenu.difficultes"
            register={register}
            multiline
            rows={5}
          />
          <BilingualField
            label={t('project.learnings')}
            name="contenu.apprentissages"
            register={register}
            multiline
            rows={5}
          />
        </FormSection>

        <FormSection title={t('project.links')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {LIEN_KEYS.map((key) => (
              <TextField
                key={key}
                label={t(`project.link.${key}`)}
                type="url"
                placeholder="https://"
                {...register(`contenu.liens.${key}`)}
              />
            ))}
          </div>
        </FormSection>
      </div>
    </form>
  );
}

export default function ProjectEditor() {
  const { t } = useTranslation();
  const l = useLocalized();
  const navigate = useNavigate();
  const { projetId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  // Incrémenté après une restauration : le formulaire repart des données restaurées.
  const [formVersion, setFormVersion] = useState(0);

  const id = projetId ? Number(projetId) : null;
  const path = `/projets/${id}`;
  const project = useAdminQuery(path, () => api.get<Projet>(`${ADMIN}${path}`), id !== null);
  const projet = id === null ? null : (project.data ?? null);

  const requested = searchParams.get('onglet');
  const tab: Tab = TABS.find((item) => item === requested) ?? 'general';
  const availableTabs = id === null ? FORM_TABS : TABS;

  const setStatus = useAdminMutation(
    (statut: StatutPublication) => api.post<Projet>(`${ADMIN}${path}/statut`, { statut }),
    { successKey: 'admin.project.statusChanged' },
  );
  const published = projet?.statut_publication === 'publie';

  return (
    <QueryState isLoading={id !== null && project.isLoading} error={project.error}>
      <PageHeader
        title={projet ? l(projet.titre) : t('admin.project.create')}
        actions={
          <>
            <Link className="btn btn-ghost" to="/admin/projets">
              {t('admin.project.backToList')}
            </Link>
            {projet && (
              <>
                <Link className="btn btn-secondary" to={`/admin/projets/${projet.id}/apercu`}>
                  {t('admin.preview')}
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStatus.mutate(published ? 'brouillon' : 'publie')}
                >
                  {t(published ? 'admin.project.unpublish' : 'admin.project.publish')}
                </button>
              </>
            )}
            {FORM_TABS.includes(tab) && (
              <button type="submit" form={FORM_ID} className="btn btn-primary">
                {t('admin.save')}
              </button>
            )}
          </>
        }
      />
      {projet && (
        <p className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONES[projet.statut_publication]}>
            {t(`enums.statut_publication.${projet.statut_publication}`)}
          </Badge>
          {published && (
            <span className="text-muted text-sm">{t('admin.project.publishReminder')}</span>
          )}
        </p>
      )}

      <div className="border-border mb-6 flex flex-wrap gap-1 border-b" role="tablist">
        {availableTabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={item === tab}
            className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${item === tab ? 'border-accent text-accent' : 'text-muted hover:text-fg border-transparent'}`}
            onClick={() => setSearchParams({ onglet: item }, { replace: true })}
          >
            {t(`admin.project.tabs.${item}`)}
          </button>
        ))}
      </div>
      {id === null && <p className="text-muted mb-4 text-sm">{t('admin.project.saveFirst')}</p>}

      {(id === null || projet) && (
        <div hidden={!FORM_TABS.includes(tab)}>
          <ProjectForm
            key={`${id ?? 'new'}-${formVersion}`}
            projet={projet}
            tab={tab}
            onSaved={(saved) => {
              if (id === null) navigate(`/admin/projets/${saved.id}?onglet=contenu`);
            }}
          />
        </div>
      )}
      {projet && tab === 'galerie' && <GalleryTab projetId={projet.id} />}
      {projet && tab === 'demos' && <DemosTab projetId={projet.id} />}
      {projet && tab === 'historique' && (
        <HistoryTab projetId={projet.id} onRestored={() => setFormVersion((value) => value + 1)} />
      )}
    </QueryState>
  );
}
