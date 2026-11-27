import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { MetierFigure } from '../../components/design/MetierFigure';
import { api } from '../../lib/api';
import { useLocalized } from '../../lib/localized';
import { metierClass } from '../../lib/metierStyle';
import { COULEURS_METIER, FIGURES_METIER, type Metier, type MetierInput } from '../../lib/types';
import { ADMIN } from '../api';
import {
  BilingualField,
  MoveButtons,
  PageHeader,
  QueryState,
  SelectField,
} from '../components/form';
import { moveItem, useAdminMutation, useAdminQuery } from '../hooks';

/** Formulaire d'un métier, avec l'aperçu de sa carte tel qu'il apparaîtra sur le site. */
function MetierForm({ metier }: { metier: Metier }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const { register, handleSubmit, control, reset } = useForm<MetierInput>({
    defaultValues: {
      nom: metier.nom,
      description: metier.description,
      offre: metier.offre,
      figure: metier.figure,
      couleur: metier.couleur,
    },
  });
  const [figure, couleur, nom] = useWatch({ control, name: ['figure', 'couleur', 'nom'] });
  const save = useAdminMutation(
    (data: MetierInput) => api.put<Metier>(`${ADMIN}/metiers/${metier.id}`, data),
    { onSuccess: (saved) => reset(saved) },
  );

  return (
    <form
      className="grid gap-6 lg:grid-cols-[1fr_18rem]"
      onSubmit={handleSubmit((data) => save.mutate(data))}
    >
      <div className="space-y-4">
        <BilingualField label={t('admin.metier.name')} name="nom" register={register} />
        <BilingualField
          label={t('admin.metier.descriptionField')}
          hint={t('admin.metier.descriptionHint')}
          name="description"
          register={register}
          multiline
          rows={3}
        />
        <BilingualField
          label={t('admin.metier.offerTitle')}
          hint={t('admin.metier.offerHint')}
          name="offre.titre"
          register={register}
        />
        <BilingualField
          label={t('admin.metier.offerText')}
          name="offre.texte"
          register={register}
          multiline
          rows={3}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t('admin.metier.figure')} {...register('figure')}>
            {FIGURES_METIER.map((value) => (
              <option key={value} value={value}>
                {t(`enums.figure_metier.${value}`)}
              </option>
            ))}
          </SelectField>
          <SelectField label={t('admin.metier.colour')} {...register('couleur')}>
            {COULEURS_METIER.map((value) => (
              <option key={value} value={value}>
                {t(`enums.couleur_metier.${value}`)}
              </option>
            ))}
          </SelectField>
        </div>
        <button type="submit" className="btn btn-primary" disabled={save.isPending}>
          {t('admin.save')}
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-muted text-sm font-semibold">{t('admin.metier.preview')}</p>
        {/* Le même composant que sur le site : l'aperçu est fidèle. */}
        <div
          className={`${metierClass(couleur)} border-border bg-bg flex flex-col gap-3 rounded-2xl border border-t-4 border-t-[var(--m)] p-4`}
        >
          <MetierFigure figure={figure} />
          <p className="font-display font-bold">{l(nom)}</p>
        </div>
        <p className="text-muted text-xs">{t('admin.metier.computedHint')}</p>
      </div>
    </form>
  );
}

export default function MetiersAdmin() {
  const { t } = useTranslation();
  const l = useLocalized();
  const metiers = useAdminQuery('/metiers', () => api.get<Metier[]>(`${ADMIN}/metiers`));
  const reorder = useAdminMutation((ids: number[]) => api.put(`${ADMIN}/metiers/ordre`, { ids }), {
    successKey: 'admin.reordered',
  });
  const list = metiers.data ?? [];

  return (
    <>
      <PageHeader title={t('admin.nav.metiers')} description={t('admin.metier.description')} />
      <QueryState isLoading={metiers.isLoading} error={metiers.error}>
        <ol className="space-y-6">
          {list.map((metier, index) => (
            <li key={metier.id} className="card space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <MoveButtons
                  index={index}
                  count={list.length}
                  itemLabel={l(metier.nom)}
                  onMove={(from, to) =>
                    reorder.mutate(moveItem(list, from, to).map((item) => item.id))
                  }
                />
                <h2 className="text-xl font-bold">{l(metier.nom)}</h2>
                <code className="text-muted text-sm">?metier={metier.slug}</code>
              </div>
              <MetierForm metier={metier} />
            </li>
          ))}
        </ol>
      </QueryState>
    </>
  );
}
