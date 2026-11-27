import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { HeroBackdrop } from '../components/design/HeroBackdrop';
import { MetierFigure } from '../components/design/MetierFigure';
import { Availability, KeyFigures, Monogram } from '../components/design/ProfileBits';
import { Reveal } from '../components/design/Reveal';
import { Markdown } from '../components/Markdown';
import { PageSection } from '../components/PageSection';
import { Timeline } from '../components/Timeline';
import { useSite } from '../lib/content';
import { useLocalized } from '../lib/localized';
import { useMetier, withMetier } from '../lib/metier';
import { metierClass } from '../lib/metierStyle';
import { useReveal } from '../lib/reveal';
import { usePageSeo } from '../lib/seo';
import type { LocalizedText } from '../lib/types';

/** Les mots entre **…** du slogan sont mis en valeur par un dégradé. */
function Slogan({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, index) =>
        part.startsWith('**') ? (
          <span key={index} className="text-gradient">
            {part.slice(2, -2)}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

const CARD_ICONS: ReactNode[] = [
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </>,
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </>,
  <>
    <path d="M4 6h16M4 12h10M4 18h6" />
    <circle cx="18" cy="16" r="3" />
  </>,
];

function IntroCards({ cards }: { cards: { title: string; text: LocalizedText }[] }) {
  const l = useLocalized();
  const shown = cards.filter((card) => l(card.text));
  if (shown.length === 0) return null;
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {shown.map((card, index) => (
        <Reveal
          as="li"
          key={card.title}
          delay={0.1 + index * 0.12}
          className="card flex flex-col gap-4 p-7 shadow-sm transition-transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="bg-surface-2 text-accent flex size-11 items-center justify-center rounded-xl">
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {CARD_ICONS[index % CARD_ICONS.length]}
              </svg>
            </span>
            <span className="font-display text-border text-4xl font-bold" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <h3 className="text-xl font-bold">{card.title}</h3>
          <div className="text-muted">
            <Markdown>{l(card.text)}</Markdown>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}

interface MethodStep {
  title: string;
  text: string;
  deliverable: string;
}

/** Les 4 étapes d'un projet : la ligne se remplit et chaque étape s'allume à son tour. */
function MethodSteps() {
  const { t } = useTranslation();
  const ref = useReveal<HTMLDivElement>();
  const steps: MethodStep[] = [0, 1, 2, 3].map((index) => ({
    title: t(`about.method.steps.${index}.title`),
    text: t(`about.method.steps.${index}.text`),
    deliverable: t(`about.method.steps.${index}.deliverable`),
  }));
  const delay = (index: number) => ({ '--delay': `${0.4 + index * 0.9}s` }) as CSSProperties;
  return (
    <div ref={ref} className="reveal space-y-6">
      <div className="relative hidden h-11 lg:block" aria-hidden="true">
        <span className="bg-border absolute top-[21px] right-[calc(25%-2.5rem)] left-[22px] h-0.5" />
        <span className="method-fill absolute top-[21px] right-[calc(25%-2.5rem)] left-[22px] h-0.5 bg-gradient-to-r from-[var(--color-accent)] to-[#ffb36b]" />
        {steps.map((step, index) => (
          <span
            key={step.title}
            className="method-node bg-surface border-accent text-accent font-display absolute top-0 flex size-11 items-center justify-center rounded-full border-2 font-bold"
            style={{ ...delay(index), left: `calc(${index} * (100% + 1.5rem) / 4)` }}
          >
            {index + 1}
          </span>
        ))}
      </div>
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="border-border bg-bg flex flex-col gap-3 rounded-2xl border p-6 transition-[transform,border-color] hover:-translate-y-1 hover:border-[var(--color-accent)]"
          >
            <span className="text-accent font-display text-sm font-bold lg:hidden">
              {index + 1}
            </span>
            <h3 className="text-lg font-bold">{step.title}</h3>
            <p className="text-muted flex-1 text-sm">{step.text}</p>
            <div className="border-border space-y-1 border-t border-dashed pt-3">
              <p className="text-faint text-xs font-bold tracking-widest uppercase">
                {t('about.method.youGet')}
              </p>
              <p className="text-sm font-semibold text-[#ffb36b]">{step.deliverable}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function About() {
  const { t } = useTranslation();
  const l = useLocalized();
  const { data: site } = useSite();
  const [metier] = useMetier();
  usePageSeo('about', site);
  if (!site) return null;
  const { profil } = site;
  const { presentation } = profil;
  const slogan = l(presentation.slogan);
  const offers = site.metiers.filter((item) => l(item.offre.titre));

  return (
    <>
      <section className="border-border relative overflow-hidden border-b">
        <HeroBackdrop id="a-propos" />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_auto]">
          <div className="space-y-6">
            <Reveal as="p" className="eyebrow">
              {t('nav.about')}
            </Reveal>
            <Reveal as="h1" delay={0.08} className="text-5xl leading-tight font-bold sm:text-6xl">
              {slogan ? <Slogan text={slogan} /> : l(profil.titre) || t('nav.about')}
            </Reveal>
            {l(presentation.accroche) && (
              <Reveal delay={0.16} className="text-muted max-w-2xl text-lg">
                <Markdown>{l(presentation.accroche)}</Markdown>
              </Reveal>
            )}
            <KeyFigures site={site} />
          </div>
          <Reveal delay={0.25} className="flex flex-col items-center gap-5">
            <Monogram nom={profil.nom} />
            <Availability profil={profil} />
            {l(presentation.localisation) && (
              <p className="text-muted text-sm">{l(presentation.localisation)}</p>
            )}
          </Reveal>
        </div>
      </section>

      <PageSection light>
        <IntroCards
          cards={[
            { title: t('about.profile'), text: presentation.profil },
            { title: t('about.direction'), text: presentation.orientation },
            { title: t('project.howIWork'), text: presentation.methode },
          ]}
        />
      </PageSection>

      {offers.length > 0 && (
        <PageSection
          dotted
          eyebrow={t('about.offers.eyebrow')}
          title={t('about.offers.title')}
          aside={
            <Link
              className="text-accent font-semibold hover:underline"
              to={withMetier('/projets', metier)}
            >
              {t('about.offers.seeWork')} →
            </Link>
          }
        >
          <p className="text-muted -mt-4 mb-8 max-w-2xl">{t('about.offers.lead')}</p>
          <ul className="grid gap-6 md:grid-cols-3">
            {offers.map((item, index) => (
              <Reveal
                as="li"
                key={item.slug}
                delay={0.1 + index * 0.12}
                className={`${metierClass(item.couleur)} border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6 transition-[transform,border-color] hover:-translate-y-1 hover:border-[var(--m)]`}
              >
                <MetierFigure figure={item.figure} />
                <h3 className="text-lg font-bold">{l(item.offre.titre)}</h3>
                <p className="text-muted">{l(item.offre.texte)}</p>
              </Reveal>
            ))}
          </ul>
        </PageSection>
      )}

      <PageSection raised eyebrow={t('about.method.eyebrow')} title={t('about.method.title')}>
        <MethodSteps />
      </PageSection>

      <PageSection
        id="parcours"
        light
        eyebrow={t('about.timelineEyebrow')}
        title={t('about.timelineTitle')}
      >
        {site.parcours.length === 0 ? (
          <p className="text-muted">{t('common.comingSoon')}</p>
        ) : (
          <Timeline entries={site.parcours} filterable />
        )}
      </PageSection>
    </>
  );
}
