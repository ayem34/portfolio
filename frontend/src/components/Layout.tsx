import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { useSite } from '../lib/content';
import { useMetier, withMetier } from '../lib/metier';
import { HeroBackdrop } from './design/HeroBackdrop';
import { Reveal } from './design/Reveal';
import { LanguageSwitch } from './LanguageSwitch';

const NAV_ITEMS = [
  { to: '/projets', key: 'projects' },
  { to: '/a-propos', key: 'about' },
  { to: '/competences', key: 'skills' },
  { to: '/contact', key: 'contact' },
] as const;

/** Bandeau de fin de page : il s'adresse aux deux publics (client et recruteur). */
function ClosingBand() {
  const { t } = useTranslation();
  const { data: site } = useSite();
  const [metier] = useMetier();
  const cvUrl = site?.profil.cv_url;
  return (
    <section className="border-border relative overflow-hidden border-t">
      <HeroBackdrop id="fin" />
      <Reveal className="container-page relative flex flex-wrap items-center justify-between gap-6 py-16 sm:py-20">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-bold sm:text-4xl">{t('footer.title')}</h2>
          <p className="text-muted text-lg">{t('footer.lead')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn-primary" to={withMetier('/contact?objet=projet', metier)}>
            {t('footer.project')}
          </Link>
          <Link className="btn btn-secondary" to={withMetier('/contact?objet=emploi', metier)}>
            {t('footer.job')}
          </Link>
          {cvUrl && (
            <a className="btn btn-ghost" href={cvUrl} target="_blank" rel="noopener">
              {t('home.cv')}
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/** En-tête, menu et pied de page du site public. */
export function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { data: site } = useSite();
  const [metier] = useMetier();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = site?.profil.nom || t('site.defaultName');
  const profil = site?.profil;
  const liens = profil?.liens;

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
      <header className="border-border bg-bg/90 sticky top-0 z-40 border-b backdrop-blur">
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
                      `flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors ${isActive ? 'text-accent' : 'text-fg hover:text-accent'}`
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

      <footer>
        <ClosingBand />
        <div className="border-border border-t py-8">
          <div className="container-page text-muted flex flex-wrap items-center justify-between gap-4 text-sm">
            <p>
              © {new Date().getFullYear()} {name}
            </p>
            <ul className="flex flex-wrap gap-5">
              {profil?.email && (
                <li>
                  <a className="hover:text-accent underline" href={`mailto:${profil.email}`}>
                    {profil.email}
                  </a>
                </li>
              )}
              {liens?.linkedin && (
                <li>
                  <a
                    className="hover:text-accent underline"
                    href={liens.linkedin}
                    rel="me noopener"
                  >
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
        </div>
      </footer>
    </div>
  );
}
