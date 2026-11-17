import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router-dom';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function Placeholder() {
  const { t } = useTranslation();
  return (
    <main className="container-page flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">{t('common.siteUnderConstruction')}</h1>
    </main>
  );
}

function Loading() {
  const { t } = useTranslation();
  return <p className="container-page text-muted py-24 text-center">{t('common.loading')}</p>;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Placeholder />} />
      </Routes>
    </Suspense>
  );
}
