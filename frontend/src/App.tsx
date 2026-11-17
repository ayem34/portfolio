import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { useSite } from './lib/content';
import About from './pages/About';
import Contact from './pages/Contact';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ProjectPage from './pages/ProjectPage';
import Projects from './pages/Projects';
import Skills from './pages/Skills';

// L'admin est chargé à la demande : le visiteur ne télécharge pas son code.
const AdminApp = lazy(() => import('./admin/AdminApp'));

function Loading({ messageKey = 'common.loading' }: { messageKey?: string }) {
  const { t } = useTranslation();
  return <p className="container-page text-muted py-24 text-center">{t(messageKey)}</p>;
}

function PublicSite() {
  const site = useSite();
  return (
    <Layout>
      {site.isError ? (
        <Loading messageKey="errors.chargement" />
      ) : site.isLoading ? (
        <Loading />
      ) : (
        <Routes>
          <Route index element={<Home />} />
          <Route path="projets" element={<Projects />} />
          <Route path="projets/:slug" element={<ProjectPage />} />
          <Route path="a-propos" element={<About />} />
          <Route path="competences" element={<Skills />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<Loading />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<PublicSite />} />
    </Routes>
  );
}
