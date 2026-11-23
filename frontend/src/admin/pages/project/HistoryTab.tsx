import { useTranslation } from 'react-i18next';

import { api } from '../../../lib/api';
import { formatDate, useLanguage, useLocalized } from '../../../lib/localized';
import type { Projet, VersionProjet } from '../../../lib/types';
import { ADMIN } from '../../api';
import { QueryState } from '../../components/form';
import { useAdminMutation, useAdminQuery } from '../../hooks';

interface HistoryTabProps {
  projetId: number;
  onRestored: () => void;
}

/** Historique des versions : chaque enregistrement garde une copie de l'état précédent. */
export function HistoryTab({ projetId, onRestored }: HistoryTabProps) {
  const { t } = useTranslation();
  const l = useLocalized();
  const language = useLanguage();
  const path = `/projets/${projetId}/versions`;
  const versions = useAdminQuery(path, () => api.get<VersionProjet[]>(`${ADMIN}${path}`));
  const restore = useAdminMutation(
    (versionId: number) => api.post<Projet>(`${ADMIN}${path}/${versionId}/restaurer`),
    { successKey: 'admin.history.restored', onSuccess: onRestored },
  );

  return (
    <QueryState isLoading={versions.isLoading} error={versions.error}>
      <p className="text-muted mb-4 text-sm">{t('admin.history.description')}</p>
      {versions.data?.length === 0 ? (
        <p className="card text-muted p-6">{t('admin.history.empty')}</p>
      ) : (
        <ol className="space-y-3">
          {versions.data?.map((version) => (
            <li
              key={version.id}
              className="card flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="font-semibold">
                  {formatDate(version.date, language, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="text-muted text-sm">{l(version.contenu.titre)}</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={restore.isPending}
                onClick={() => {
                  if (window.confirm(t('admin.history.confirmRestore'))) restore.mutate(version.id);
                }}
              >
                {t('admin.history.restore')}
              </button>
            </li>
          ))}
        </ol>
      )}
    </QueryState>
  );
}
