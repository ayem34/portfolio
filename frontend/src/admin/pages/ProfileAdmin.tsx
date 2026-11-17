import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { api } from '../../lib/api';
import { PRESENTATION_KEYS, type Profil } from '../../lib/types';
import { ADMIN } from '../api';
import { BilingualField, FormSection, PageHeader, QueryState, TextField } from '../components/form';
import { MediaPicker } from '../components/MediaPicker';
import { useAdminMutation, useAdminQuery } from '../hooks';

function ProfileForm({ profil }: { profil: Profil }) {
  const { t } = useTranslation();
  const { register, handleSubmit, control, reset } = useForm<Profil>({ defaultValues: profil });
  const save = useAdminMutation(
    (data: Profil) => api.put<Profil>(`${ADMIN}/profil`, { ...data, cv_url: data.cv_url || null }),
    { onSuccess: (saved) => reset(saved) },
  );

  return (
    <form className="space-y-6" onSubmit={handleSubmit((data) => save.mutate(data))}>
      <FormSection title={t('admin.profile.identity')}>
        <TextField label={t('admin.profile.name')} {...register('nom')} />
        <BilingualField label={t('admin.profile.headline')} name="titre" register={register} />
      </FormSection>

      <FormSection title={t('admin.profile.contact')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t('admin.profile.email')} type="email" {...register('email')} />
          <TextField
            label="LinkedIn"
            type="url"
            placeholder="https://www.linkedin.com/in/…"
            {...register('liens.linkedin')}
          />
          <TextField
            label="GitHub"
            type="url"
            placeholder="https://github.com/…"
            {...register('liens.github')}
          />
        </div>
        <Controller
          control={control}
          name="cv_url"
          render={({ field }) => (
            <MediaPicker
              label={t('admin.profile.cv')}
              value={field.value ?? ''}
              onChange={field.onChange}
              types={['pdf']}
            />
          )}
        />
      </FormSection>

      <FormSection title={t('admin.profile.presentation')}>
        <p className="text-muted text-sm">{t('admin.markdownHint')}</p>
        {PRESENTATION_KEYS.map((key) => (
          <BilingualField
            key={key}
            label={t(`admin.profile.sections.${key}`)}
            hint={t(`admin.profile.sectionHints.${key}`)}
            name={`presentation.${key}`}
            register={register}
            multiline
            rows={key === 'accroche' ? 3 : 6}
          />
        ))}
      </FormSection>

      <button type="submit" className="btn btn-primary" disabled={save.isPending}>
        {t('admin.save')}
      </button>
    </form>
  );
}

export default function ProfileAdmin() {
  const { t } = useTranslation();
  const profil = useAdminQuery('/profil', () => api.get<Profil>(`${ADMIN}/profil`));
  return (
    <>
      <PageHeader title={t('admin.nav.profile')} description={t('admin.profile.description')} />
      <QueryState isLoading={profil.isLoading} error={profil.error}>
        {profil.data && <ProfileForm profil={profil.data} />}
      </QueryState>
    </>
  );
}
