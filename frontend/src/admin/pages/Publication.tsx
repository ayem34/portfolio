import { useTranslation } from 'react-i18next';

import { api } from '../../lib/api';
import { ADMIN } from '../api';
import { PageHeader, QueryState } from '../components/form';
import { useAdminMutation, useAdminQuery } from '../hooks';

interface PublicationState {
  configuree: boolean;
  site_url: string;
}

/** Bouton « Mettre le site à jour » : régénère les pages publiques. */
export default function Publication() {
  const { t } = useTranslation();
  const state = useAdminQuery('/publication', () =>
    api.get<PublicationState>(`${ADMIN}/publication`),
  );
  const publish = useAdminMutation(
    () => api.post<{ declenchee: boolean }>(`${ADMIN}/publication`),
    {
      successKey: 'admin.publication.started',
    },
  );

  return (
    <>
      <PageHeader title={t('admin.nav.publication')} />
      <QueryState isLoading={state.isLoading} error={state.error}>
        <div className="card max-w-2xl space-y-5 p-6">
          <p>{t('admin.publication.explanation')}</p>
          <p className="text-muted text-sm">{t('admin.publication.scope')}</p>
          {state.data && !state.data.configuree && (
            <p className="text-warning" role="alert">
              {t('errors.deploy_hook_non_configure')}
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={publish.isPending || !state.data?.configuree}
            onClick={() => publish.mutate(undefined)}
          >
            {t('admin.publication.button')}
          </button>
          {publish.isSuccess && (
            <p role="status">
              {t('admin.publication.done')}{' '}
              <a
                className="text-accent underline"
                href={state.data?.site_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {state.data?.site_url}
              </a>
            </p>
          )}
        </div>
      </QueryState>
    </>
  );
}
