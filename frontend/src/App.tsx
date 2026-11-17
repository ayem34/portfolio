import { useTranslation } from 'react-i18next';

export default function App() {
  const { t } = useTranslation();
  return (
    <main className="container-page flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">{t('common.siteUnderConstruction')}</h1>
    </main>
  );
}
