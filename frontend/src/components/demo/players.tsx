/** Lecteurs des démos autres que la visite guidée : un petit composant par type. */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { sandboxLoginUrl, youtubeEmbedUrl } from '../../lib/demo';
import { useLanguage, useLocalized } from '../../lib/localized';
import type { PublicDemo } from '../../lib/types';

function Unavailable({ messageKey }: { messageKey: string }) {
  const { t } = useTranslation();
  return (
    <p className="card text-muted p-6 text-center" role="status">
      {t(messageKey)}
    </p>
  );
}

function OpenInNewTab({ url, labelKey = 'demo.openInNewTab' }: { url: string; labelKey?: string }) {
  const { t } = useTranslation();
  return (
    <a className="btn btn-secondary" href={url} target="_blank" rel="noopener noreferrer">
      {t(labelKey)}
    </a>
  );
}

const FRAME_CLASS = 'border-border w-full rounded-xl border bg-white';

export function VideoPlayer({ demo }: { demo: PublicDemo }) {
  const { t } = useTranslation();
  const language = useLanguage();
  if (!demo.url) return <Unavailable messageKey="demo.unavailable" />;

  const embedUrl = youtubeEmbedUrl(demo.url);
  if (embedUrl) {
    return (
      <iframe
        className={`${FRAME_CLASS} aspect-video`}
        src={embedUrl}
        title={t('enums.type_demo.video')}
        allow="encrypted-media; picture-in-picture; fullscreen"
        loading="lazy"
      />
    );
  }
  const subtitles = demo.config.sous_titres;
  return (
    <video className="border-border w-full rounded-xl border bg-black" controls preload="metadata">
      <source src={demo.url} />
      {(['fr', 'en'] as const).map(
        (lang) =>
          subtitles[lang] && (
            <track
              key={lang}
              kind="subtitles"
              src={subtitles[lang]}
              srcLang={lang}
              label={t(`language.${lang}`)}
              default={lang === language}
            />
          ),
      )}
      <a href={demo.url}>{t('demo.downloadVideo')}</a>
    </video>
  );
}

/**
 * Notebook publié en HTML. Le fichier est chargé puis affiché dans un cadre isolé
 * (sandbox) : ses scripts ne peuvent ni lire la page ni agir pour le visiteur.
 */
export function NotebookViewer({ demo }: { demo: PublicDemo }) {
  const { t } = useTranslation();
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!demo.url) return;
    const controller = new AbortController();
    setHtml(null);
    setFailed(false);
    fetch(demo.url, { signal: controller.signal })
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error('http'))))
      .then(setHtml)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [demo.url]);

  if (!demo.url) return <Unavailable messageKey="demo.unavailable" />;
  if (failed) {
    return (
      <div className="card space-y-4 p-6 text-center">
        <p role="alert">{t('demo.notebookError')}</p>
        <OpenInNewTab url={demo.url} />
      </div>
    );
  }
  if (html === null) return <Unavailable messageKey="common.loading" />;
  return (
    <div className="space-y-3">
      <iframe
        className={`${FRAME_CLASS} h-[75vh]`}
        srcDoc={html}
        sandbox="allow-scripts"
        title={t('enums.type_demo.notebook')}
      />
      <OpenInNewTab url={demo.url} />
    </div>
  );
}

/** Playground de modèle (Gradio / Streamlit sur Hugging Face Spaces), intégré en iframe. */
export function PlaygroundFrame({ demo }: { demo: PublicDemo }) {
  const { t } = useTranslation();
  if (!demo.url) return <Unavailable messageKey="demo.playgroundUnavailable" />;
  return (
    <div className="space-y-3">
      <p className="text-muted text-sm">{t('demo.playgroundHint')}</p>
      <iframe
        className={`${FRAME_CLASS} h-[75vh]`}
        src={demo.url}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        allow="clipboard-write"
        title={t('enums.type_demo.playground')}
        loading="lazy"
      />
      <OpenInNewTab url={demo.url} />
    </div>
  );
}

export function ExternalDemoLink({ demo }: { demo: PublicDemo }) {
  if (!demo.url) return <Unavailable messageKey="demo.unavailable" />;
  return (
    <div className="card flex flex-col items-center gap-4 p-8 text-center">
      <OpenInNewTab url={demo.url} labelKey="demo.openExternal" />
    </div>
  );
}

type WakeState = 'waking' | 'ready' | 'unreachable';
const WAKE_TIMEOUT_MS = 60_000;
const WAKE_RETRY_MS = 4_000;

/** Réveille le serveur du projet présenté (les offres gratuites le mettent en veille). */
function useWakeUp(url: string): WakeState {
  const [state, setState] = useState<WakeState>('waking');
  useEffect(() => {
    if (!url) {
      setState('unreachable');
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();
    setState('waking');

    const ping = () => {
      // « no-cors » : on ne lit pas la réponse, on veut seulement savoir si le serveur répond.
      fetch(url, { mode: 'no-cors', cache: 'no-store' })
        .then(() => {
          if (!cancelled) setState('ready');
        })
        .catch(() => {
          if (cancelled) return;
          if (Date.now() - startedAt > WAKE_TIMEOUT_MS) setState('unreachable');
          else timer = setTimeout(ping, WAKE_RETRY_MS);
        });
    };
    ping();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url]);
  return state;
}

interface SandboxLauncherProps {
  demo: PublicDemo;
  /** Propose la visite guidée en attendant, si le projet en a une. */
  onShowTour?: () => void;
}

/**
 * Bac à sable en direct (section 4.5) : un bouton par rôle, connexion en un clic.
 * Aucun identifiant n'est demandé ; le projet présenté gère la session de démo.
 */
export function SandboxLauncher({ demo, onShowTour }: SandboxLauncherProps) {
  const { t } = useTranslation();
  const l = useLocalized();
  const { adresse_connexion: loginUrl, roles } = demo.config;
  const state = useWakeUp(demo.url || loginUrl);

  if (!loginUrl || roles.length === 0) return <Unavailable messageKey="demo.unavailable" />;

  return (
    <div className="card space-y-5 p-6 sm:p-8">
      <p className="text-muted text-sm">{t('demo.sandboxNotice')}</p>
      {state !== 'ready' && (
        <div className="bg-surface-2 space-y-3 rounded-xl p-4" role="status">
          <p className="font-medium">
            {t(state === 'waking' ? 'demo.sandboxWaking' : 'demo.sandboxUnreachable')}
          </p>
          {onShowTour && (
            <button type="button" className="btn btn-secondary" onClick={onShowTour}>
              {t('demo.sandboxTourMeanwhile')}
            </button>
          )}
        </div>
      )}
      <ul className="flex flex-wrap gap-3">
        {roles.map((role) => (
          <li key={role.cle}>
            <a
              className={`btn btn-primary ${state === 'waking' ? 'pointer-events-none opacity-50' : ''}`}
              href={sandboxLoginUrl(loginUrl, role.cle)}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={state === 'waking'}
              tabIndex={state === 'waking' ? -1 : undefined}
            >
              {t('demo.exploreAs', { role: l(role.libelle) })}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
