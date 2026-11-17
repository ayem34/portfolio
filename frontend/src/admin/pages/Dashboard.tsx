import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { api } from '../../lib/api';
import { formatDate, useLanguage, useLocalized } from '../../lib/localized';
import type { Metier, StatCompteur, Statistiques } from '../../lib/types';
import { ADMIN } from '../api';
import { PageHeader, QueryState, SelectField } from '../components/form';
import { useAdminQuery } from '../hooks';

const PERIODS = [7, 30, 90, 365];

function StatTile({ label, value, to }: { label: string; value: number; to?: string }) {
  const content = (
    <>
      <p className="font-display text-accent text-3xl font-bold">{value}</p>
      <p className="text-muted mt-1 text-sm">{label}</p>
    </>
  );
  return to ? (
    <Link to={to} className="card hover:border-accent block p-5">
      {content}
    </Link>
  ) : (
    <div className="card p-5">{content}</div>
  );
}

/** Répartition simple : une barre proportionnelle par ligne, avec sa valeur en clair. */
function Breakdown({
  title,
  rows,
  label,
}: {
  title: string;
  rows: StatCompteur[];
  label: (key: string) => string;
}) {
  const { t } = useTranslation();
  const max = Math.max(1, ...rows.map((row) => row.total));
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-muted text-sm">{t('admin.dashboard.noData')}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.cle}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span>{label(row.cle)}</span>
                <span className="font-semibold">{row.total}</span>
              </div>
              <div className="bg-surface-2 h-2 rounded-full" aria-hidden="true">
                <div
                  className="bg-accent h-full rounded-full"
                  style={{ width: `${(row.total / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const l = useLocalized();
  const language = useLanguage();
  const [days, setDays] = useState(30);
  const path = `/statistiques?jours=${days}`;
  const stats = useAdminQuery(path, () => api.get<Statistiques>(`${ADMIN}${path}`));
  const metiers = useAdminQuery('/metiers', () => api.get<Metier[]>(`${ADMIN}/metiers`));
  const metierName = (slug: string) =>
    l(metiers.data?.find((metier) => metier.slug === slug)?.nom) || slug;
  const data = stats.data;

  return (
    <>
      <PageHeader
        title={t('admin.nav.dashboard')}
        actions={
          <SelectField
            label={t('admin.dashboard.period')}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            {PERIODS.map((period) => (
              <option key={period} value={period}>
                {t('admin.dashboard.lastDays', { count: period })}
              </option>
            ))}
          </SelectField>
        }
      />
      <QueryState isLoading={stats.isLoading} error={stats.error}>
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile label={t('admin.dashboard.views')} value={data.total_vues} />
              <StatTile
                label={t('admin.dashboard.demoLaunches')}
                value={data.total_demos_lancees}
              />
              <StatTile
                label={t('admin.dashboard.unreadMessages')}
                value={data.messages_non_traites}
                to="/admin/messages"
              />
              <StatTile
                label={t('admin.dashboard.pendingRequests')}
                value={data.demandes_en_attente}
                to="/admin/demandes-acces"
              />
            </div>

            <section className="card overflow-x-auto p-5">
              <h2 className="mb-4 text-lg font-semibold">{t('admin.dashboard.viewsPerProject')}</h2>
              {data.vues_par_projet.length === 0 ? (
                <p className="text-muted text-sm">{t('admin.dashboard.noData')}</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-muted">
                    <tr>
                      <th className="py-2 pr-4 font-medium">{t('admin.project.singular')}</th>
                      <th className="py-2 pr-4 font-medium">{t('admin.dashboard.views')}</th>
                      <th className="py-2 font-medium">{t('admin.dashboard.demoLaunches')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vues_par_projet.map((row) => (
                      <tr key={row.projet_id} className="border-border border-t">
                        <td className="py-2 pr-4">
                          <Link
                            className="hover:text-accent underline"
                            to={`/admin/projets/${row.projet_id}`}
                          >
                            {l(row.titre)}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{row.vues}</td>
                        <td className="py-2">{row.demos_lancees}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Breakdown
                title={t('admin.dashboard.demosByType')}
                rows={data.demos_lancees}
                label={(key) => t(`enums.type_demo.${key}`, { defaultValue: key })}
              />
              <Breakdown
                title={t('admin.dashboard.chosenMetiers')}
                rows={data.metiers_choisis}
                label={metierName}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card p-5">
                <h2 className="mb-4 text-lg font-semibold">
                  {t('admin.dashboard.latestMessages')}
                </h2>
                {data.derniers_messages.length === 0 ? (
                  <p className="text-muted text-sm">{t('admin.dashboard.noData')}</p>
                ) : (
                  <ul className="space-y-3">
                    {data.derniers_messages.map((message) => (
                      <li key={message.id} className="text-sm">
                        <p className="font-semibold">
                          {message.nom}{' '}
                          <span className="text-muted font-normal">
                            · {formatDate(message.date, language)}
                          </span>
                        </p>
                        <p className="text-muted line-clamp-2">{message.contenu}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="card p-5">
                <h2 className="mb-4 text-lg font-semibold">
                  {t('admin.dashboard.latestRequests')}
                </h2>
                {data.dernieres_demandes.length === 0 ? (
                  <p className="text-muted text-sm">{t('admin.dashboard.noData')}</p>
                ) : (
                  <ul className="space-y-3">
                    {data.dernieres_demandes.map((demande) => (
                      <li key={demande.id} className="text-sm">
                        <p className="font-semibold">
                          {demande.nom} ({demande.entreprise}){' '}
                          <span className="text-muted font-normal">
                            · {t(`enums.statut_demande.${demande.statut}`)}
                          </span>
                        </p>
                        <p className="text-muted">{l(demande.projet_titre)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}
