import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLocalized } from '../lib/localized';
import {
  INFO_KEYS,
  type InfoKey,
  LIEN_KEYS,
  type LocalizedText,
  METHODE_KEYS,
  type PublicDemo,
  type PublicMedia,
  type PublicProjetDetail,
} from '../lib/types';
import { metierClass } from '../lib/metierStyle';
import { useSite } from '../lib/content';
import { DemoPlayer } from './demo/DemoPlayer';
import { HeroBackdrop } from './design/HeroBackdrop';
import { Reveal } from './design/Reveal';
import { Markdown } from './Markdown';
import { Modal } from './Modal';
import { PageSection } from './PageSection';
import { ProjectBadges } from './ProjectBadges';

interface ProjectViewProps {
  projet: PublicProjetDetail;
  /** Appelé quand le visiteur lance une démo (statistiques). */
  onDemoLaunch?: (demo: PublicDemo) => void;
  /** Affiché à la place du contenu quand le projet est protégé (accès sur demande). */
  lockedContent?: ReactNode;
  /** Lien de retour affiché en haut de l'en-tête (absent dans l'aperçu de l'admin). */
  backLink?: ReactNode;
}

/** Petites icônes de la ligne d'infos clés (période, rôle, équipe, cadre). */
const INFO_ICONS: Record<InfoKey, ReactNode> = {
  periode: <path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" />,
  role: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  equipe: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 1.5 6 4" />
    </>
  ),
  cadre: <path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5" />,
};

function InfoLine({ infos }: { infos: Record<InfoKey, LocalizedText> | undefined }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const items = INFO_KEYS.filter((key) => infos && l(infos[key]));
  if (!infos || items.length === 0) return null;
  return (
    <ul className="text-muted flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      {items.map((key) => (
        <li key={key} className="inline-flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="text-accent size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {INFO_ICONS[key]}
          </svg>
          <span className="sr-only">{t(`project.infos.${key}`)} :</span>
          {l(infos[key])}
        </li>
      ))}
    </ul>
  );
}

function Gallery({ medias }: { medias: PublicMedia[] }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const [opened, setOpened] = useState<PublicMedia | null>(null);
  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {medias.map((media) => {
          const caption = l(media.legende);
          return (
            <li key={media.id}>
              <figure className="card overflow-hidden">
                <button
                  type="button"
                  className="block w-full cursor-zoom-in"
                  onClick={() => setOpened(media)}
                  aria-label={t('project.enlarge', { caption: caption || t('project.gallery') })}
                >
                  <img
                    src={media.url}
                    alt={caption}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                </button>
                {caption && <figcaption className="text-muted p-3 text-sm">{caption}</figcaption>}
              </figure>
            </li>
          );
        })}
      </ul>
      <Modal
        open={opened !== null}
        onClose={() => setOpened(null)}
        title={(opened && l(opened.legende)) || t('project.gallery')}
        wide
      >
        {opened && (
          <img src={opened.url} alt={l(opened.legende)} className="h-auto w-full rounded-lg" />
        )}
      </Modal>
    </>
  );
}

/**
 * Fiche projet complète (section 4.1). Utilisée telle quelle par la page publique
 * et par l'aperçu de l'admin.
 */
export function ProjectView({ projet, onDemoLaunch, lockedContent, backLink }: ProjectViewProps) {
  const { t } = useTranslation();
  const l = useLocalized();
  const { data: site } = useSite();
  const colours = new Map(site?.metiers.map((item) => [item.slug, item.couleur]));
  const mainDemo = projet.demos[0];
  const [activeDemoId, setActiveDemoId] = useState(mainDemo?.id ?? 0);

  const selectDemo = (demo: PublicDemo) => {
    setActiveDemoId(demo.id);
    onDemoLaunch?.(demo);
  };
  const demoLabel = (demo: PublicDemo) => l(demo.config.titre) || t(`enums.type_demo.${demo.type}`);
  const has = (text: LocalizedText | undefined) => Boolean(text && l(text).trim());

  const contenu = projet.contenu;
  const methodSections = contenu ? METHODE_KEYS.filter((key) => has(contenu.methode[key])) : [];
  const links = contenu ? LIEN_KEYS.filter((key) => contenu.liens[key]) : [];
  const figures = contenu?.chiffres.filter((chiffre) => chiffre.valeur) ?? [];

  return (
    <article>
      <header className="border-border relative overflow-hidden border-b">
        <HeroBackdrop id="fiche" />
        <div className="container-page relative space-y-5 pt-8 pb-14 sm:pb-20">
          {backLink}
          <Reveal as="p" className="eyebrow pt-4">
            {t(`enums.categorie.${projet.categorie}`)}
          </Reveal>
          <Reveal as="h1" delay={0.08} className="max-w-4xl text-4xl font-bold sm:text-6xl">
            {l(projet.titre)}
          </Reveal>
          <Reveal as="p" delay={0.16} className="text-muted max-w-3xl text-lg sm:text-xl">
            {l(projet.resume)}
          </Reveal>
          <Reveal delay={0.24} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {projet.metiers.map((metier) => (
                <span
                  key={metier.slug}
                  className={`${metierClass(colours.get(metier.slug))} rounded-full border border-[var(--m)] px-2.5 py-0.5 text-xs font-semibold text-[var(--m)]`}
                >
                  {l(metier.nom)}
                </span>
              ))}
              <ProjectBadges projet={projet} />
            </div>
            <InfoLine infos={contenu?.infos} />
            {projet.technologies_detail.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted mr-1 text-sm">{t('project.technologies')}</span>
                {projet.technologies_detail.map((technologie) => (
                  <Link
                    key={technologie.id}
                    to={`/competences#competence-${technologie.id}`}
                    className="bg-surface-2 hover:text-accent rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
                  >
                    {technologie.nom}
                  </Link>
                ))}
              </div>
            )}
          </Reveal>
          <Reveal delay={0.32} className="flex flex-wrap gap-3 pt-2">
            {mainDemo && (
              <a className="btn btn-primary" href="#demo" onClick={() => selectDemo(mainDemo)}>
                {t('project.openDemo', { demo: demoLabel(mainDemo) })}
              </a>
            )}
            {contenu &&
              links.map((key) => (
                <a
                  key={key}
                  className="btn btn-secondary"
                  href={contenu.liens[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t(`project.link.${key}`)}
                </a>
              ))}
          </Reveal>
        </div>
      </header>

      {projet.protege && lockedContent}

      {projet.demos.length > 0 && (
        <PageSection id="demo" title={t('project.demo')}>
          <DemoPlayer demos={projet.demos} activeId={activeDemoId} onSelect={selectDemo} />
        </PageSection>
      )}

      {contenu && has(contenu.contexte) && (
        <PageSection title={t('project.context')} light>
          <div className="max-w-3xl">
            <Markdown>{l(contenu.contexte)}</Markdown>
          </div>
        </PageSection>
      )}

      {contenu && (has(contenu.objectifs) || has(contenu.resultats) || figures.length > 0) && (
        <PageSection title={t('project.goalsAndResults')}>
          {figures.length > 0 && (
            <dl className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {figures.map((chiffre, index) => (
                <div key={index} className="card flex flex-col-reverse p-5">
                  <dt className="text-muted mt-1 text-sm">{l(chiffre.libelle)}</dt>
                  <dd className="font-display text-accent text-3xl font-bold">{chiffre.valeur}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="grid gap-8 md:grid-cols-2">
            {has(contenu.objectifs) && (
              <div>
                <h3 className="mb-3 text-lg font-semibold">{t('project.goals')}</h3>
                <Markdown>{l(contenu.objectifs)}</Markdown>
              </div>
            )}
            {has(contenu.resultats) && (
              <div>
                <h3 className="mb-3 text-lg font-semibold">{t('project.results')}</h3>
                <Markdown>{l(contenu.resultats)}</Markdown>
              </div>
            )}
          </div>
        </PageSection>
      )}

      {contenu && methodSections.length > 0 && (
        <PageSection title={t('project.howIWork')} light>
          <div className="grid gap-5 md:grid-cols-2">
            {methodSections.map((key) => (
              <div key={key} className="card p-5 sm:p-6">
                <h3 className="mb-3 text-lg font-semibold">{t(`project.method.${key}`)}</h3>
                <Markdown>{l(contenu.methode[key])}</Markdown>
              </div>
            ))}
          </div>
        </PageSection>
      )}

      {projet.galerie.length > 0 && (
        <PageSection title={t('project.gallery')} light>
          <Gallery medias={projet.galerie} />
        </PageSection>
      )}

      {contenu && (has(contenu.difficultes) || has(contenu.apprentissages)) && (
        <PageSection title={t('project.challengesAndLearnings')}>
          <div className="grid gap-8 md:grid-cols-2">
            {has(contenu.difficultes) && (
              <div>
                <h3 className="mb-3 text-lg font-semibold">{t('project.challenges')}</h3>
                <Markdown>{l(contenu.difficultes)}</Markdown>
              </div>
            )}
            {has(contenu.apprentissages) && (
              <div>
                <h3 className="mb-3 text-lg font-semibold">{t('project.learnings')}</h3>
                <Markdown>{l(contenu.apprentissages)}</Markdown>
              </div>
            )}
          </div>
        </PageSection>
      )}
    </article>
  );
}
