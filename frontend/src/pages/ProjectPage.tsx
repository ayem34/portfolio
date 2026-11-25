import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { AccessGate } from '../components/AccessGate';
import { ProjectView } from '../components/ProjectView';
import { NotFoundError, useProject, useSite } from '../lib/content';
import { useLanguage } from '../lib/localized';
import { useMetier, withMetier } from '../lib/metier';
import { projectMeta, useSeo } from '../lib/seo';
import { recordConsultation } from '../lib/tracking';
import type { PublicDemo, PublicProjetDetail } from '../lib/types';
import NotFound from './NotFound';

function ProjectContent({ published }: { published: PublicProjetDetail }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const { data: site } = useSite();
  const [metier] = useMetier();
  // Projet confidentiel : contenu complet reçu de l'API après saisie d'un code valide.
  const [unlocked, setUnlocked] = useState<PublicProjetDetail | null>(null);
  const projet = unlocked ?? published;
  useSeo(projectMeta(projet, site, language, t));

  // Une vue par ouverture de fiche (les fiches déverrouillées sont comptées par l'API).
  const metierRef = useRef(metier);
  metierRef.current = metier;
  useEffect(() => {
    recordConsultation({ slug: published.slug, metier_choisi: metierRef.current });
  }, [published.slug]);

  const launched = useRef(new Set<number>());
  const onDemoLaunch = (demo: PublicDemo) => {
    if (launched.current.has(demo.id)) return;
    launched.current.add(demo.id);
    recordConsultation({ slug: projet.slug, type_demo: demo.type, metier_choisi: metier });
  };

  return (
    <>
      <div className="container-page pt-6">
        <Link
          className="text-muted hover:text-accent text-sm underline"
          to={withMetier('/projets', metier)}
        >
          {t('project.backToProjects')}
        </Link>
      </div>
      <ProjectView
        key={unlocked ? 'unlocked' : 'published'}
        projet={projet}
        onDemoLaunch={onDemoLaunch}
        lockedContent={<AccessGate slug={projet.slug} onUnlocked={setUnlocked} />}
      />
    </>
  );
}

export default function ProjectPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const project = useProject(slug);

  if (project.data) return <ProjectContent key={slug} published={project.data} />;
  if (project.error instanceof NotFoundError) return <NotFound />;
  return (
    <p
      className="container-page text-muted py-24 text-center"
      role={project.error ? 'alert' : 'status'}
    >
      {t(project.error ? 'errors.chargement' : 'common.loading')}
    </p>
  );
}
