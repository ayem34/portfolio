import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { Availability } from '../components/design/ProfileBits';
import { Reveal } from '../components/design/Reveal';
import { Field, Honeypot, SelectField, TextArea } from '../components/FormFields';
import { Markdown } from '../components/Markdown';
import { PageIntro, PageSection } from '../components/PageSection';
import { api } from '../lib/api';
import { useSite } from '../lib/content';
import { useErrorMessage } from '../lib/errors';
import { useLocalized } from '../lib/localized';
import { useHydrated } from '../lib/metier';
import { usePageSeo } from '../lib/seo';
import { OBJETS_MESSAGE, type ObjetMessage } from '../lib/types';

const schema = z.object({
  objet: z.enum(['projet', 'stage', 'emploi', 'autre']),
  nom: z.string().trim().min(1).max(120),
  entreprise: z.string().trim().max(160),
  email: z.string().trim().email(),
  contenu: z.string().trim().min(10).max(5000),
  site_web: z.string(),
});
type ContactForm = z.infer<typeof schema>;

const isObjet = (value: string | null): value is ObjetMessage =>
  OBJETS_MESSAGE.includes(value as ObjetMessage);

function ContactFormCard({ objet }: { objet: ObjetMessage }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { register, handleSubmit, reset, formState } = useForm<ContactForm>({
    resolver: zodResolver(schema),
    values: { objet, nom: '', entreprise: '', email: '', contenu: '', site_web: '' },
    resetOptions: { keepDirtyValues: true },
  });
  const send = useMutation({
    mutationFn: (data: ContactForm) => api.post('/public/messages', data),
    onSuccess: () => reset(),
  });
  const { errors } = formState;

  return (
    <form
      className="card relative space-y-5 p-6 shadow-sm sm:p-8"
      onSubmit={handleSubmit((data) => send.mutate(data))}
      noValidate
    >
      <h2 className="text-2xl font-bold">{t('contact.formTitle')}</h2>
      <SelectField
        label={t('contact.subject')}
        options={OBJETS_MESSAGE.map((value) => ({
          value,
          label: t(`enums.objet_message.${value}`),
        }))}
        {...register('objet')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t('contact.name')}
          autoComplete="name"
          error={errors.nom && t('contact.nameRequired')}
          {...register('nom')}
        />
        <Field
          label={t('contact.company')}
          hint={t('contact.optional')}
          autoComplete="organization"
          {...register('entreprise')}
        />
      </div>
      <Field
        label={t('contact.email')}
        type="email"
        autoComplete="email"
        error={errors.email && t('contact.emailInvalid')}
        {...register('email')}
      />
      <TextArea
        label={t('contact.message')}
        rows={6}
        error={errors.contenu && t('contact.messageTooShort')}
        {...register('contenu')}
      />
      <Honeypot {...register('site_web')} />
      <button type="submit" className="btn btn-primary" disabled={send.isPending}>
        {t(send.isPending ? 'contact.sending' : 'contact.send')}
      </button>
      {send.isPending && (
        <p className="text-muted text-sm" role="status">
          {t('contact.slowNotice')}
        </p>
      )}
      {send.isSuccess && (
        <p className="text-success font-medium" role="status">
          {t('contact.sent')}
        </p>
      )}
      {send.isError && (
        <p className="field-error" role="alert">
          {errorMessage(send.error)}
        </p>
      )}
    </form>
  );
}

export default function Contact() {
  const { t } = useTranslation();
  const l = useLocalized();
  const { data: site } = useSite();
  const [searchParams] = useSearchParams();
  const hydrated = useHydrated();
  usePageSeo('contact', site);
  if (!site) return null;
  // ?objet=projet (bouton « Parler de mon projet ») pré-remplit l'objet du message.
  const wanted = hydrated ? searchParams.get('objet') : null;
  const objet: ObjetMessage = isObjet(wanted) ? wanted : 'projet';
  const { profil } = site;
  const { email, liens, cv_url: cvUrl } = profil;
  const links = [
    { label: 'LinkedIn', url: liens.linkedin },
    { label: 'GitHub', url: liens.github },
  ].filter((link) => link.url);

  return (
    <>
      <PageIntro
        id="contact"
        eyebrow={t('nav.contact')}
        title={t('contact.title')}
        lead={t('contact.lead')}
      />
      <PageSection light>
        <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
          <Reveal>
            <ContactFormCard objet={objet} />
          </Reveal>
          <Reveal as="aside" delay={0.12} className="space-y-5">
            <div className="card space-y-3 p-6 shadow-sm">
              <Availability profil={profil} />
              {l(profil.presentation.orientation) && (
                <div className="text-muted">
                  <Markdown>{l(profil.presentation.orientation)}</Markdown>
                </div>
              )}
              {l(profil.presentation.localisation) && (
                <p>
                  <span className="font-semibold">{t('contact.location')} : </span>
                  {l(profil.presentation.localisation)}
                </p>
              )}
            </div>
            <div className="card space-y-4 p-6 shadow-sm">
              <h2 className="text-xl font-bold">{t('contact.details')}</h2>
              <dl className="space-y-3">
                {email && (
                  <div>
                    <dt className="text-muted text-sm">{t('contact.email')}</dt>
                    <dd>
                      <a
                        className="text-accent font-semibold break-all underline"
                        href={`mailto:${email}`}
                      >
                        {email}
                      </a>
                    </dd>
                  </div>
                )}
                {links.map((link) => (
                  <div key={link.label}>
                    <dt className="text-muted text-sm">{link.label}</dt>
                    <dd>
                      <a
                        className="text-accent font-semibold break-all underline"
                        href={link.url}
                        target="_blank"
                        rel="me noopener noreferrer"
                      >
                        {link.url.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
              {cvUrl && (
                <a className="btn btn-secondary" href={cvUrl} target="_blank" rel="noopener">
                  {t('contact.downloadCv')}
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </PageSection>
    </>
  );
}
