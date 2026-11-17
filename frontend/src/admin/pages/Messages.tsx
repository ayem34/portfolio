import { useTranslation } from 'react-i18next';

import { Badge } from '../../components/Badge';
import { api } from '../../lib/api';
import { formatDate, useLanguage } from '../../lib/localized';
import type { Message } from '../../lib/types';
import { ADMIN } from '../api';
import { PageHeader, QueryState } from '../components/form';
import { useAdminMutation, useAdminQuery } from '../hooks';

export default function Messages() {
  const { t } = useTranslation();
  const language = useLanguage();
  const messages = useAdminQuery('/messages', () => api.get<Message[]>(`${ADMIN}/messages`));
  const setHandled = useAdminMutation(({ id, traite }: { id: number; traite: boolean }) =>
    api.put<Message>(`${ADMIN}/messages/${id}`, { traite }),
  );
  const remove = useAdminMutation((id: number) => api.delete(`${ADMIN}/messages/${id}`), {
    successKey: 'admin.deleted',
  });

  return (
    <>
      <PageHeader title={t('admin.nav.messages')} description={t('admin.messages.description')} />
      <QueryState isLoading={messages.isLoading} error={messages.error}>
        {messages.data?.length === 0 ? (
          <p className="card text-muted p-6">{t('admin.messages.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {messages.data?.map((message) => (
              <li key={message.id} className="card space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {message.nom}{' '}
                    <a
                      className="text-accent font-normal underline"
                      href={`mailto:${message.email}`}
                    >
                      {message.email}
                    </a>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted text-sm">
                      {formatDate(message.date, language, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <Badge tone={message.traite ? 'success' : 'warning'}>
                      {t(message.traite ? 'admin.messages.handled' : 'admin.messages.toHandle')}
                    </Badge>
                  </div>
                </div>
                <p className="whitespace-pre-wrap">{message.contenu}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setHandled.mutate({ id: message.id, traite: !message.traite })}
                  >
                    {t(
                      message.traite ? 'admin.messages.markToHandle' : 'admin.messages.markHandled',
                    )}
                  </button>
                  <a className="btn btn-secondary" href={`mailto:${message.email}`}>
                    {t('admin.messages.reply')}
                  </a>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      if (window.confirm(t('admin.confirmDelete'))) remove.mutate(message.id);
                    }}
                  >
                    {t('admin.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </>
  );
}
