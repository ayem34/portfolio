import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { api } from '../../lib/api';
import { EMPTY_TEXT, formatDate, useLanguage, useLocalized } from '../../lib/localized';
import { type Parcours, type ParcoursInput, TYPES_PARCOURS } from '../../lib/types';
import { ADMIN } from '../api';
import { BilingualField, PageHeader, QueryState, SelectField, TextField } from '../components/form';
import { MediaPicker } from '../components/MediaPicker';
import { useAdminMutation, useAdminQuery } from '../hooks';

const EMPTY_ENTRY: ParcoursInput = {
  type: 'formation',
  titre: EMPTY_TEXT,
  etablissement: '',
  date_debut: '',
  date_fin: null,
  description: EMPTY_TEXT,
  justificatif_url: null,
};

function EntryForm({ entry, onDone }: { entry: Parcours | null; onDone: () => void }) {
  const { t } = useTranslation();
  const { register, handleSubmit, control, formState } = useForm<ParcoursInput>({
    defaultValues: entry ?? EMPTY_ENTRY,
  });
  const save = useAdminMutation(
    (data: ParcoursInput) => {
      // Un champ vide du formulaire vaut « pas de date de fin » / « pas de justificatif ».
      const payload = {
        ...data,
        date_fin: data.date_fin || null,
        justificatif_url: data.justificatif_url || null,
      };
      return entry
        ? api.put<Parcours>(`${ADMIN}/parcours/${entry.id}`, payload)
        : api.post<Parcours>(`${ADMIN}/parcours`, payload);
    },
    { onSuccess: onDone },
  );

  return (
    <form className="space-y-4" onSubmit={handleSubmit((data) => save.mutate(data))}>
      <SelectField label={t('admin.timeline.type')} {...register('type')}>
        {TYPES_PARCOURS.map((type) => (
          <option key={type} value={type}>
            {t(`enums.type_parcours.${type}`)}
          </option>
        ))}
      </SelectField>
      <BilingualField label={t('admin.timeline.entryTitle')} name="titre" register={register} />
      <TextField label={t('admin.timeline.organisation')} {...register('etablissement')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('admin.timeline.startDate')}
          type="date"
          error={formState.errors.date_debut && t('admin.required')}
          {...register('date_debut', { required: true })}
        />
        <TextField
          label={t('admin.timeline.endDate')}
          hint={t('admin.timeline.endDateHint')}
          type="date"
          {...register('date_fin')}
        />
      </div>
      <BilingualField
        label={t('admin.timeline.descriptionField')}
        name="description"
        register={register}
        multiline
        rows={3}
      />
      <Controller
        control={control}
        name="justificatif_url"
        render={({ field }) => (
          <MediaPicker
            label={t('admin.timeline.proof')}
            hint={t('admin.timeline.proofHint')}
            value={field.value ?? ''}
            onChange={field.onChange}
            types={['pdf', 'image']}
          />
        )}
      />
      <button type="submit" className="btn btn-primary" disabled={save.isPending}>
        {t('admin.save')}
      </button>
    </form>
  );
}

export default function TimelineAdmin() {
  const { t } = useTranslation();
  const l = useLocalized();
  const language = useLanguage();
  const entries = useAdminQuery('/parcours', () => api.get<Parcours[]>(`${ADMIN}/parcours`));
  const [editing, setEditing] = useState<Parcours | null | undefined>(undefined);
  const remove = useAdminMutation((id: number) => api.delete(`${ADMIN}/parcours/${id}`), {
    successKey: 'admin.deleted',
  });
  const month = (value: string | null) =>
    formatDate(value, language, { month: 'short', year: 'numeric' });

  return (
    <>
      <PageHeader
        title={t('admin.nav.timeline')}
        description={t('admin.timeline.description')}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
            {t('admin.timeline.create')}
          </button>
        }
      />
      <QueryState isLoading={entries.isLoading} error={entries.error}>
        {entries.data?.length === 0 ? (
          <p className="card text-muted p-6">{t('admin.timeline.empty')}</p>
        ) : (
          <ol className="space-y-2">
            {entries.data?.map((entry) => (
              <li key={entry.id} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-48 flex-1">
                  <p className="font-semibold">{l(entry.titre)}</p>
                  <p className="text-muted text-sm">
                    {entry.etablissement} · {month(entry.date_debut)} –{' '}
                    {entry.date_fin ? month(entry.date_fin) : t('timeline.ongoing')}
                  </p>
                </div>
                <Badge tone="accent">{t(`enums.type_parcours.${entry.type}`)}</Badge>
                {entry.justificatif_url && <Badge tone="success">{t('timeline.proof')}</Badge>}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditing(entry)}
                >
                  {t('admin.edit')}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    if (window.confirm(t('admin.confirmDelete'))) remove.mutate(entry.id);
                  }}
                >
                  {t('admin.delete')}
                </button>
              </li>
            ))}
          </ol>
        )}
      </QueryState>
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={t(editing ? 'admin.timeline.edit' : 'admin.timeline.create')}
      >
        {editing !== undefined && (
          <EntryForm
            key={editing?.id ?? 'new'}
            entry={editing}
            onDone={() => setEditing(undefined)}
          />
        )}
      </Modal>
    </>
  );
}
