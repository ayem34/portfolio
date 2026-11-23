import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { api } from '../../lib/api';
import { EMPTY_TEXT, useLocalized } from '../../lib/localized';
import { NIVEAUX, type Technologie, type TechnologieInput } from '../../lib/types';
import { ADMIN } from '../api';
import {
  BilingualField,
  MoveButtons,
  PageHeader,
  QueryState,
  SelectField,
  TextField,
} from '../components/form';
import { moveItem, useAdminMutation, useAdminQuery } from '../hooks';

const EMPTY_SKILL: TechnologieInput = { nom: '', domaine: EMPTY_TEXT, niveau: 'notions' };

interface SkillFormProps {
  skill: Technologie | null;
  domains: Technologie['domaine'][];
  onDone: () => void;
}

function SkillForm({ skill, domains, onDone }: SkillFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, setValue, formState } = useForm<TechnologieInput>({
    defaultValues: skill
      ? { nom: skill.nom, domaine: skill.domaine, niveau: skill.niveau }
      : EMPTY_SKILL,
  });
  const save = useAdminMutation(
    (data: TechnologieInput) =>
      skill
        ? api.put<Technologie>(`${ADMIN}/technologies/${skill.id}`, data)
        : api.post<Technologie>(`${ADMIN}/technologies`, data),
    { onSuccess: onDone },
  );

  return (
    <form className="space-y-4" onSubmit={handleSubmit((data) => save.mutate(data))}>
      <TextField
        label={t('admin.skill.name')}
        error={formState.errors.nom && t('admin.required')}
        {...register('nom', { required: true })}
      />
      {domains.length > 0 && (
        <SelectField
          label={t('admin.skill.existingDomain')}
          defaultValue=""
          onChange={(event) => {
            const domain = domains[Number(event.target.value)];
            if (domain) setValue('domaine', domain, { shouldDirty: true });
          }}
        >
          <option value="">{t('admin.skill.newDomain')}</option>
          {domains.map((domain, index) => (
            <option key={domain.fr} value={index}>
              {domain.fr}
            </option>
          ))}
        </SelectField>
      )}
      <BilingualField label={t('admin.skill.domain')} name="domaine" register={register} />
      <SelectField label={t('admin.skill.level')} {...register('niveau')}>
        {NIVEAUX.map((niveau) => (
          <option key={niveau} value={niveau}>
            {t(`enums.niveau.${niveau}`)}
          </option>
        ))}
      </SelectField>
      <button type="submit" className="btn btn-primary" disabled={save.isPending}>
        {t('admin.save')}
      </button>
    </form>
  );
}

export default function SkillsAdmin() {
  const { t } = useTranslation();
  const l = useLocalized();
  const skills = useAdminQuery('/technologies', () =>
    api.get<Technologie[]>(`${ADMIN}/technologies`),
  );
  // undefined : fenêtre fermée ; null : création ; sinon modification.
  const [editing, setEditing] = useState<Technologie | null | undefined>(undefined);
  const reorder = useAdminMutation(
    (ids: number[]) => api.put(`${ADMIN}/technologies/ordre`, { ids }),
    { successKey: 'admin.reordered' },
  );
  const remove = useAdminMutation((id: number) => api.delete(`${ADMIN}/technologies/${id}`), {
    successKey: 'admin.deleted',
  });
  const list = skills.data ?? [];
  const domains = [...new Map(list.map((skill) => [skill.domaine.fr, skill.domaine])).values()];

  return (
    <>
      <PageHeader
        title={t('admin.nav.skills')}
        description={t('admin.skill.description')}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
            {t('admin.skill.create')}
          </button>
        }
      />
      <QueryState isLoading={skills.isLoading} error={skills.error}>
        {list.length === 0 ? (
          <p className="card text-muted p-6">{t('admin.skill.empty')}</p>
        ) : (
          <ol className="space-y-2">
            {list.map((skill, index) => (
              <li key={skill.id} className="card flex flex-wrap items-center gap-3 p-3">
                <MoveButtons
                  index={index}
                  count={list.length}
                  itemLabel={skill.nom}
                  onMove={(from, to) =>
                    reorder.mutate(moveItem(list, from, to).map((item) => item.id))
                  }
                />
                <div className="min-w-40 flex-1">
                  <p className="font-semibold">{skill.nom}</p>
                  <p className="text-muted text-sm">
                    {l(skill.domaine)} · {t('admin.skill.usedIn', { count: skill.nb_projets })}
                  </p>
                </div>
                <Badge>{t(`enums.niveau.${skill.niveau}`)}</Badge>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditing(skill)}
                >
                  {t('admin.edit')}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    if (window.confirm(t('admin.confirmDelete'))) remove.mutate(skill.id);
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
        title={t(editing ? 'admin.skill.edit' : 'admin.skill.create')}
      >
        {editing !== undefined && (
          <SkillForm
            key={editing?.id ?? 'new'}
            skill={editing}
            domains={domains}
            onDone={() => setEditing(undefined)}
          />
        )}
      </Modal>
    </>
  );
}
