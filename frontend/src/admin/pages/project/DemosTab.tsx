import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { api } from '../../../lib/api';
import { EMPTY_TEXT } from '../../../lib/localized';
import {
  CADRES,
  type Demo,
  type DemoInput,
  type TypeDemo,
  type TypeMedia,
  TYPES_DEMO,
} from '../../../lib/types';
import { ADMIN } from '../../api';
import {
  BilingualField,
  CheckboxField,
  QueryState,
  SelectField,
  TextField,
} from '../../components/form';
import { MediaPicker } from '../../components/MediaPicker';
import { useAdminMutation, useAdminQuery } from '../../hooks';

const EMPTY_DEMO: Omit<DemoInput, 'type'> = {
  url: '',
  est_principale: false,
  config: {
    titre: EMPTY_TEXT,
    cadre: 'navigateur',
    adresse_connexion: '',
    roles: [],
    sous_titres: EMPTY_TEXT,
  },
};

/** Types de fichiers de la bibliothèque proposés pour l'adresse de la démo. */
const URL_MEDIA_TYPES: Partial<Record<TypeDemo, TypeMedia[]>> = {
  video: ['video'],
  notebook: ['notebook'],
};

function DemoForm({ demo, projetId }: { demo: Demo; projetId: number }) {
  const { t } = useTranslation();
  const { register, handleSubmit, control } = useForm<DemoInput>({
    defaultValues: {
      type: demo.type,
      url: demo.url,
      config: demo.config,
      est_principale: demo.est_principale,
    },
  });
  const roles = useFieldArray({ control, name: 'config.roles' });
  const save = useAdminMutation((data: DemoInput) =>
    api.put<Demo>(`${ADMIN}/demos/${demo.id}`, data),
  );
  const remove = useAdminMutation(() => api.delete(`${ADMIN}/demos/${demo.id}`), {
    successKey: 'admin.deleted',
  });
  const mediaTypes = URL_MEDIA_TYPES[demo.type];

  return (
    <li className="card p-5">
      <form className="space-y-4" onSubmit={handleSubmit((data) => save.mutate(data))}>
        <h2 className="text-lg font-semibold">{t(`enums.type_demo.${demo.type}`)}</h2>
        <p className="text-muted text-sm">{t(`admin.demo.help.${demo.type}`)}</p>

        {demo.type === 'visite' ? (
          <>
            <SelectField label={t('admin.tour.frame')} {...register('config.cadre')}>
              {CADRES.map((cadre) => (
                <option key={cadre} value={cadre}>
                  {t(`enums.cadre.${cadre}`)}
                </option>
              ))}
            </SelectField>
            <p>
              <Link
                className="btn btn-primary"
                to={`/admin/projets/${projetId}/demos/${demo.id}/visite`}
              >
                {t('admin.demo.openTourEditor', { count: demo.etapes.length })}
              </Link>
            </p>
          </>
        ) : mediaTypes ? (
          <Controller
            control={control}
            name="url"
            render={({ field }) => (
              <MediaPicker
                label={t('admin.demo.url')}
                value={field.value}
                onChange={field.onChange}
                types={mediaTypes}
                hint={t(`admin.demo.urlHint.${demo.type}`)}
              />
            )}
          />
        ) : (
          <TextField
            label={t('admin.demo.url')}
            type="url"
            placeholder="https://"
            hint={t(`admin.demo.urlHint.${demo.type}`)}
            {...register('url')}
          />
        )}

        {demo.type === 'video' && (
          <div className="grid gap-4 md:grid-cols-2">
            {(['fr', 'en'] as const).map((language) => (
              <Controller
                key={language}
                control={control}
                name={`config.sous_titres.${language}`}
                render={({ field }) => (
                  <MediaPicker
                    label={t('admin.demo.subtitles', { language: t(`language.${language}`) })}
                    value={field.value}
                    onChange={field.onChange}
                    types={['sous_titres']}
                  />
                )}
              />
            ))}
          </div>
        )}

        {demo.type === 'bac_a_sable' && (
          <>
            <TextField
              label={t('admin.demo.loginUrl')}
              type="url"
              placeholder="https://…/demo/login"
              hint={t('admin.demo.loginUrlHint')}
              {...register('config.adresse_connexion')}
            />
            <fieldset className="space-y-3">
              <legend className="field-label">{t('admin.demo.roles')}</legend>
              {roles.fields.map((field, index) => (
                <div key={field.id} className="border-border space-y-3 rounded-lg border p-3">
                  <TextField
                    label={t('admin.demo.roleKey')}
                    hint={t('admin.demo.roleKeyHint')}
                    {...register(`config.roles.${index}.cle`)}
                  />
                  <BilingualField
                    label={t('admin.demo.roleLabel')}
                    name={`config.roles.${index}.libelle`}
                    register={register}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => roles.remove(index)}
                  >
                    {t('admin.delete')}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => roles.append({ cle: '', libelle: EMPTY_TEXT })}
              >
                {t('admin.demo.addRole')}
              </button>
            </fieldset>
          </>
        )}

        <BilingualField
          label={t('admin.demo.title')}
          hint={t('admin.demo.titleHint')}
          name="config.titre"
          register={register}
        />
        <CheckboxField label={t('admin.demo.main')} {...register('est_principale')} />

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary" disabled={save.isPending}>
            {t('admin.save')}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (window.confirm(t('admin.confirmDelete'))) remove.mutate(undefined);
            }}
          >
            {t('admin.delete')}
          </button>
        </div>
      </form>
    </li>
  );
}

/** Démos du projet : un formulaire par démo, selon son type sur l'échelle de preuves. */
export function DemosTab({ projetId }: { projetId: number }) {
  const { t } = useTranslation();
  const path = `/projets/${projetId}/demos`;
  const demos = useAdminQuery(path, () => api.get<Demo[]>(`${ADMIN}${path}`));
  const [newType, setNewType] = useState<TypeDemo>('visite');
  const create = useAdminMutation(
    (type: TypeDemo) => api.post<Demo>(`${ADMIN}${path}`, { ...EMPTY_DEMO, type }),
    { successKey: 'admin.demo.created' },
  );

  return (
    <QueryState isLoading={demos.isLoading} error={demos.error}>
      <div className="card mb-6 flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-56 flex-1">
          <SelectField
            label={t('admin.demo.addLabel')}
            value={newType}
            onChange={(event) => setNewType(event.target.value as TypeDemo)}
          >
            {TYPES_DEMO.map((type) => (
              <option key={type} value={type}>
                {t(`enums.type_demo.${type}`)}
              </option>
            ))}
          </SelectField>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={create.isPending}
          onClick={() => create.mutate(newType)}
        >
          {t('admin.demo.add')}
        </button>
      </div>
      {demos.data?.length === 0 ? (
        <p className="text-muted">{t('admin.demo.empty')}</p>
      ) : (
        <ul className="space-y-4">
          {demos.data?.map((demo) => (
            <DemoForm key={`${demo.id}-${demo.est_principale}`} demo={demo} projetId={projetId} />
          ))}
        </ul>
      )}
    </QueryState>
  );
}
