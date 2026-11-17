import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { useSite } from '../lib/content';
import { useMetier, withMetier } from '../lib/metier';
import { LanguageSwitch } from './LanguageSwitch';

const NAV_ITEMS = [
  { to: '/projets', key: 'projects' },
  { to: '/a-propos', key: 'about' },
  { to: '/competences', key: 'skills' },
  { to: '/contact', key: 'contact' },
] as const;

/** En-tête, menu et pied de page du site public. */
export function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { data: site } = useSite();
  const [metier] = useMetier();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = site?.profil.nom || t('site.defaultName');
  const liens = site?.profil.liens;

  // Nouvelle page : on referme le menu mobile et on remonte en haut (sauf lien vers une ancre).
  useEffect(() => {
    setMenuOpen(false);
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenu"
        className="btn btn-primary sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {t('common.skipToContent')}
      </a>
      <header className="border-border bg-bg/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-x-6">
          <Link to={withMetier('/', metier)} className="font-display py-3 text-lg font-bold">
            {name}
          </Link>
          <button
            type="button"
            className="btn btn-secondary md:hidden"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {t('common.menu')}
          </button>
          <nav
            id="site-nav"
            aria-label={t('nav.label')}
            className={`w-full pb-4 md:flex md:w-auto md:items-center md:gap-2 md:pb-0 ${menuOpen ? 'block' : 'hidden'}`}
          >
            <ul className="md:flex md:items-center md:gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <NavLink
                    to={withMetier(item.to, metier)}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${isActive ? 'text-accent' : 'text-fg hover:text-accent'}`
                    }
                  >
                    {t(`nav.${item.key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-2 px-3 md:mt-0 md:px-0">
              <LanguageSwitch />
            </div>
          </nav>
        </div>
      </header>

      <main id="contenu" className="flex-1">
        {children}
      </main>

      <footer className="border-border border-t py-8">
        <div className="container-page text-muted flex flex-wrap items-center justify-between gap-4 text-sm">
          <p>{name}</p>
          <ul className="flex flex-wrap gap-5">
            {liens?.linkedin && (
              <li>
                <a className="hover:text-accent underline" href={liens.linkedin} rel="me noopener">
                  LinkedIn
                </a>
              </li>
            )}
            {liens?.github && (
              <li>
                <a className="hover:text-accent underline" href={liens.github} rel="me noopener">
                  GitHub
                </a>
              </li>
            )}
            <li>
              <Link className="hover:text-accent underline" to={withMetier('/contact', metier)}>
                {t('nav.contact')}
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
