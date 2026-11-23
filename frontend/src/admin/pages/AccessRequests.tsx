import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge, type BadgeTone } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { api } from '../../lib/api';
import { formatDate, useLanguage, useLocalized } from '../../lib/localized';
import type { Consultation, DemandeAcces, StatutDemande } from '../../lib/types';
import { ADMIN } from '../api';
import { PageHeader, QueryState } from '../components/form';
import { useAdminMutation, useAdminQuery } from '../hooks';

const STATUS_TONES: Record<StatutDemande, BadgeTone> = {
  en_attente: 'warning',
  acceptee: 'success',
  refusee: 'neutral',
  revoquee: 'danger',
};
const DATE_TIME: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };

function ConsultationLog({ demandeId }: { demandeId: number }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const path = `/demandes-acces/${demandeId}/consultations`;
  const log = useAdminQuery(path, () => api.get<Consultation[]>(`${ADMIN}${path}`));
  return (
    <QueryState isLoading={log.isLoading} error={log.error}>
      {log.data?.length === 0 ? (
        <p className="text-muted">{t('admin.access.noConsultation')}</p>
      ) : (
        <ol className="space-y-1">
          {log.data?.map((consultation) => (
            <li key={consultation.id}>{formatDate(consultation.date, language, DATE_TIME)}</li>
          ))}
        </ol>
      )}
    </QueryState>
  );
}

export default function AccessRequests() {
  const { t } = useTranslation();
  const l = useLocalized();
  const language = useLanguage();
  const requests = useAdminQuery('/demandes-acces', () =>
    api.get<DemandeAcces[]>(`${ADMIN}/demandes-acces`),
  );
  const [grantedCode, setGrantedCode] = useState<string | null>(null);
  const [logFor, setLogFor] = useState<number | null>(null);

  const decide = (action: string) => (id: number) =>
    api.post<DemandeAcces & { code?: string }>(`${ADMIN}/demandes-acces/${id}/${action}`);
  const accept = useAdminMutation(decide('accepter'), {
    successKey: 'admin.access.accepted',
    onSuccess: (demande) => setGrantedCode(demande.code ?? null),
  });
  const refuse = useAdminMutation(decide('refuser'), { successKey: 'admin.access.refused' });
  const revoke = useAdminMutation(decide('revoquer'), { successKey: 'admin.access.revoked' });

  return (
    <>
      <PageHeader
        title={t('admin.nav.accessRequests')}
        description={t('admin.access.description')}
      />
      <QueryState isLoading={requests.isLoading} error={requests.error}>
        {requests.data?.length === 0 ? (
          <p className="card text-muted p-6">{t('admin.access.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {requests.data?.map((demande) => (
              <li key={demande.id} className="card space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {demande.nom} · {demande.entreprise}{' '}
                    <a
                      className="text-accent font-normal underline"
                      href={`mailto:${demande.email}`}
                    >
                      {demande.email}
                    </a>
                  </p>
                  <Badge tone={STATUS_TONES[demande.statut]}>
                    {t(`enums.statut_demande.${demande.statut}`)}
                  </Badge>
                </div>
                <p className="text-muted text-sm">
                  {l(demande.projet_titre)} · {formatDate(demande.date, language, DATE_TIME)}
                  {demande.statut === 'acceptee' &&
                    ` · ${t('admin.access.expires', { date: formatDate(demande.expire_le, language, DATE_TIME) })}`}
                </p>
                <p className="whitespace-pre-wrap">{demande.motif}</p>
                <div className="flex flex-wrap gap-2">
                  {demande.statut === 'en_attente' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => accept.mutate(demande.id)}
                      >
                        {t('admin.access.accept')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => refuse.mutate(demande.id)}
                      >
                        {t('admin.access.refuse')}
                      </button>
                    </>
                  )}
                  {demande.statut === 'acceptee' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        if (window.confirm(t('admin.access.confirmRevoke')))
                          revoke.mutate(demande.id);
                      }}
                    >
                      {t('admin.access.revoke')}
                    </button>
                  )}
                  {demande.statut !== 'en_attente' && demande.statut !== 'refusee' && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setLogFor(demande.id)}
                    >
                      {t('admin.access.log', { count: demande.nb_consultations })}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>

      <Modal
        open={grantedCode !== null}
        onClose={() => setGrantedCode(null)}
        title={t('admin.access.codeTitle')}
      >
        <p className="font-display text-accent my-4 text-center text-3xl font-bold tracking-widest select-all">
          {grantedCode}
        </p>
        <p className="text-muted text-sm">{t('admin.access.codeNotice')}</p>
      </Modal>
      <Modal
        open={logFor !== null}
        onClose={() => setLogFor(null)}
        title={t('admin.access.logTitle')}
      >
        {logFor !== null && <ConsultationLog demandeId={logFor} />}
      </Modal>
    </>
  );
}
