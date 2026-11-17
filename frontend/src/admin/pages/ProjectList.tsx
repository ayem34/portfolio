import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Badge, type BadgeTone } from '../../components/Badge';
import { api } from '../../lib/api';
import { useLocalized } from '../../lib/localized';
import type { Projet, StatutPublication } from '../../lib/types';
import { ADMIN } from '../api';
import { MoveButtons, PageHeader, QueryState } from '../components/form';
import { moveItem, useAdminMutation, useAdminQuery } from '../hooks';
import { toProjectInput } from '../project';

export const STATUS_TONES: Record<StatutPublication, BadgeTone> = {
  brouillon: 'warning',
  publie: 'success',
  archive: 'neutral',
};

export default function ProjectList() {
  const { t } = useTranslation();
  const l = useLocalized();
  const projects = useAdminQuery('/projets', () => api.get<Projet[]>(`${ADMIN}/projets`));
  const reorder = useAdminMutation((ids: number[]) => api.put(`${ADMIN}/projets/ordre`, { ids }), {
    successKey: 'admin.reordered',
  });
  const setStatus = useAdminMutation(
    ({ id, statut }: { id: number; statut: StatutPublication }) =>
      api.post<Projet>(`${ADMIN}/projets/${id}/statut`, { statut }),
    { successKey: 'admin.project.statusChanged' },
  );
  const toggleFeatured = useAdminMutation((projet: Projet) =>
    api.put<Projet>(`${ADMIN}/projets/${projet.id}`, {
      ...toProjectInput(projet),
      est_phare: !projet.est_phare,
    }),
  );
  const remove = useAdminMutation((id: number) => api.delete(`${ADMIN}/projets/${id}`), {
    successKey: 'admin.deleted',
  });
  const list = projects.data ?? [];

  return (
    <>
      <PageHeader
        title={t('admin.nav.projects')}
        description={t('admin.project.listDescription')}
        actions={
          <Link className="btn btn-primary" to="/admin/projets/nouveau">
            {t('admin.project.create')}
          </Link>
        }
      />
      <QueryState isLoading={projects.isLoading} error={projects.error}>
        {list.length === 0 ? (
          <p className="card text-muted p-6">{t('admin.project.empty')}</p>
        ) : (
          <ol className="space-y-3">
            {list.map((projet, index) => {
              const title = l(projet.titre);
              const published = projet.statut_publication === 'publie';
              return (
                <li key={projet.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <MoveButtons
                    index={index}
                    count={list.length}
                    itemLabel={title}
                    onMove={(from, to) =>
                      reorder.mutate(moveItem(list, from, to).map((item) => item.id))
                    }
                  />
                  <div className="min-w-48 flex-1">
                    <Link
                      to={`/admin/projets/${projet.id}`}
                      className="hover:text-accent text-lg font-semibold"
                    >
                      {title}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={STATUS_TONES[projet.statut_publication]}>
                        {t(`enums.statut_publication.${projet.statut_publication}`)}
                      </Badge>
                      <Badge label={t('badges.code')}>
                        {t(`enums.acces_code.${projet.acces_code}`)}
                      </Badge>
                      <Badge label={t('badges.etat')}>{t(`enums.etat.${projet.etat}`)}</Badge>
                      {projet.est_phare && (
                        <Badge tone="accent">{t('admin.project.featured')}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link className="btn btn-secondary" to={`/admin/projets/${projet.id}`}>
                      {t('admin.edit')}
                    </Link>
                    <Link className="btn btn-secondary" to={`/admin/projets/${projet.id}/apercu`}>
                      {t('admin.preview')}
                    </Link>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      aria-pressed={projet.est_phare}
                      onClick={() => toggleFeatured.mutate(projet)}
                    >
                      {t(projet.est_phare ? 'admin.project.unfeature' : 'admin.project.feature')}
                    </button>
                    <button
                      type="button"
                      className={`btn ${published ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() =>
                        setStatus.mutate({
                          id: projet.id,
                          statut: published ? 'brouillon' : 'publie',
                        })
                      }
                    >
                      {t(published ? 'admin.project.unpublish' : 'admin.project.publish')}
                    </button>
                    {projet.statut_publication !== 'archive' && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setStatus.mutate({ id: projet.id, statut: 'archive' })}
                      >
                        {t('admin.project.archive')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        if (window.confirm(t('admin.confirmDelete'))) remove.mutate(projet.id);
                      }}
                    >
                      {t('admin.delete')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </QueryState>
    </>
  );
}
