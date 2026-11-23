import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lazy, type ReactNode, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Route, Routes } from 'react-router-dom';

import { LanguageSwitch } from '../components/LanguageSwitch';
import { api, ApiError } from '../lib/api';
import { formatDate, useLanguage } from '../lib/localized';
import type { AdminSession, Statistiques } from '../lib/types';
import { ADMIN } from './api';
import { ADMIN_KEY, SESSION_KEY, ToastProvider, useAdminQuery } from './hooks';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectEditor = lazy(() => import('./pages/ProjectEditor'));
const ProjectPreview = lazy(() => import('./pages/ProjectPreview'));
const TourEditor = lazy(() => import('./pages/TourEditor'));
const SkillsAdmin = lazy(() => import('./pages/SkillsAdmin'));
const TimelineAdmin = lazy(() => import('./pages/TimelineAdmin'));
const ProfileAdmin = lazy(() => import('./pages/ProfileAdmin'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));
const Messages = lazy(() => import('./pages/Messages'));
const AccessRequests = lazy(() => import('./pages/AccessRequests'));
const Publication = lazy(() => import('./pages/Publication'));

const NAV_ITEMS = [
  { to: '/admin', key: 'dashboard', end: true },
  { to: '/admin/projets', key: 'projects' },
  { to: '/admin/competences', key: 'skills' },
  { to: '/admin/parcours', key: 'timeline' },
  { to: '/admin/profil', key: 'profile' },
  { to: '/admin/medias', key: 'media' },
  { to: '/admin/messages', key: 'messages' },
  { to: '/admin/demandes-acces', key: 'accessRequests' },
  { to: '/admin/publication', key: 'publication' },
] as const;

function Layout({ session, children }: { session: AdminSession; children: ReactNode }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const stats = useAdminQuery('/statistiques?jours=30', () =>
    api.get<Statistiques>(`${ADMIN}/statistiques?jours=30`),
  );
  const pending: Partial<Record<(typeof NAV_ITEMS)[number]['key'], number>> = {
    messages: stats.data?.messages_non_traites,
    accessRequests: stats.data?.demandes_en_attente,
  };

  const logout = async () => {
    await api.post('/auth/deconnexion');
    queryClient.removeQueries({ queryKey: [ADMIN_KEY] });
    // La session est redemandée : l'API répond 401 et la page de connexion s'affiche.
    await queryClient.resetQueries({ queryKey: SESSION_KEY });
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#admin-main" className="btn btn-primary sr-only focus:not-sr-only">
        {t('common.skipToContent')}
      </a>
      <aside className="border-border bg-surface border-b lg:min-h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 p-4">
          <p className="font-display text-lg font-bold">{t('admin.title')}</p>
          <button
            type="button"
            className="btn btn-secondary lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="admin-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {t('common.menu')}
          </button>
        </div>
        <nav
          id="admin-nav"
          aria-label={t('admin.navLabel')}
          className={`px-2 pb-4 lg:block ${menuOpen ? 'block' : 'hidden'}`}
        >
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  end={'end' in item}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-medium ${isActive ? 'bg-accent text-on-accent' : 'text-fg hover:bg-surface-2'}`
                  }
                >
                  {t(`admin.nav.${item.key}`)}
                  {Boolean(pending[item.key]) && (
                    <span className="bg-surface-2 text-fg rounded-full px-2 text-xs font-bold">
                      {pending[item.key]}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="border-border mt-4 space-y-3 border-t px-3 pt-4 text-sm">
            <p className="text-muted break-all">{session.email}</p>
            {session.derniere_connexion && (
              <p className="text-muted">
                {t('admin.lastLogin', {
                  date: formatDate(session.derniere_connexion, language, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }),
                })}
              </p>
            )}
            <LanguageSwitch />
            <a className="btn btn-secondary w-full" href="/" target="_blank" rel="noopener">
              {t('admin.viewSite')}
            </a>
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={() => void logout()}
            >
              {t('admin.logout')}
            </button>
          </div>
        </nav>
      </aside>
      <main id="admin-main" className="min-w-0 p-5 sm:p-8">
        <Suspense fallback={<p className="text-muted">{t('common.loading')}</p>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

/** Administration : route privée /admin, absente du menu public. */
export default function AdminApp() {
  const { t } = useTranslation();
  const session = useQuery({
    queryKey: SESSION_KEY,
    queryFn: () => api.get<AdminSession>('/auth/moi'),
    retry: (count, error) => error instanceof ApiError && error.status === 0 && count < 20,
    retryDelay: 3000,
    staleTime: Infinity,
  });

  let content: ReactNode;
  if (session.data) {
    content = (
      <Layout session={session.data}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="projets" element={<ProjectList />} />
          <Route path="projets/nouveau" element={<ProjectEditor />} />
          <Route path="projets/:projetId" element={<ProjectEditor />} />
          <Route path="projets/:projetId/apercu" element={<ProjectPreview />} />
          <Route path="projets/:projetId/demos/:demoId/visite" element={<TourEditor />} />
          <Route path="competences" element={<SkillsAdmin />} />
          <Route path="parcours" element={<TimelineAdmin />} />
          <Route path="profil" element={<ProfileAdmin />} />
          <Route path="medias" element={<MediaLibrary />} />
          <Route path="messages" element={<Messages />} />
          <Route path="demandes-acces" element={<AccessRequests />} />
          <Route path="publication" element={<Publication />} />
          <Route path="*" element={<p role="alert">{t('errors.introuvable')}</p>} />
        </Routes>
      </Layout>
    );
  } else if (session.error instanceof ApiError && session.error.status === 401) {
    content = <Login />;
  } else {
    // Le serveur gratuit de l'API peut être en veille : on attend son réveil.
    content = (
      <p className="container-page py-24 text-center" role="status">
        {t(session.isError ? 'errors.serveur_injoignable' : 'admin.wakingApi')}
      </p>
    );
  }
  return <ToastProvider>{content}</ToastProvider>;
}
