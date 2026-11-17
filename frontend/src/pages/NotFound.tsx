import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useSite } from '../lib/content';
import { usePageSeo } from '../lib/seo';

export default function NotFound() {
  const { t } = useTranslation();
  const { data: site } = useSite();
  usePageSeo('notFound', site);
  return (
    <div className="container-page space-y-6 py-24 text-center">
      <h1 className="text-4xl font-bold">{t('notFound.title')}</h1>
      <p className="text-muted">{t('notFound.text')}</p>
      <Link className="btn btn-primary" to="/">
        {t('notFound.home')}
      </Link>
    </div>
  );
}
