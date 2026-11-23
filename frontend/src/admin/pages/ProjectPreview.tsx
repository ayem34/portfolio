import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { ProjectView } from '../../components/ProjectView';
import { api } from '../../lib/api';
import type { PublicProjetDetail } from '../../lib/types';
import { ADMIN } from '../api';
import { QueryState } from '../components/form';
import { useAdminQuery } from '../hooks';

/** Aperçu d'un projet, même en brouillon : exactement le rendu de la fiche publique. */
export default function ProjectPreview() {
  const { t } = useTranslation();
  const { projetId } = useParams();
  const path = `/projets/${projetId}/apercu`;
  const preview = useAdminQuery(path, () => api.get<PublicProjetDetail>(`${ADMIN}${path}`));

  return (
    <QueryState isLoading={preview.isLoading} error={preview.error}>
      <div className="border-warning mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <p className="font-medium">{t('admin.project.previewBanner')}</p>
        <Link className="btn btn-secondary" to={`/admin/projets/${projetId}`}>
          {t('admin.project.backToEditor')}
        </Link>
      </div>
      {preview.data && (
        <div className="border-border overflow-hidden rounded-2xl border">
          <ProjectView projet={preview.data} />
        </div>
      )}
    </QueryState>
  );
}
