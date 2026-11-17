import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Field, Honeypot, TextArea } from '../components/FormFields';
import { PageIntro, PageSection } from '../components/PageSection';
import { api } from '../lib/api';
import { useSite } from '../lib/content';
import { useErrorMessage } from '../lib/errors';
import { usePageSeo } from '../lib/seo';

const schema = z.object({
  nom: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  contenu: z.string().trim().min(10).max(5000),
  site_web: z.string(),
});
type ContactForm = z.infer<typeof schema>;

function ContactFormCard() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { register, handleSubmit, reset, formState } = useForm<ContactForm>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', email: '', contenu: '', site_web: '' },
  });
  const send = useMutation({
    mutationFn: (data: ContactForm) => api.post('/public/messages', data),
    onSuccess: () => reset(),
  });
  const { errors } = formState;

  return (
    <form
      className="card relative space-y-5 p-6 sm:p-8"
      onSubmit={handleSubmit((data) => send.mutate(data))}
      noValidate
    >
      <h2 className="text-2xl font-bold">{t('contact.formTitle')}</h2>
      <Field
        label={t('contact.name')}
        autoComplete="name"
        error={errors.nom && t('contact.nameRequired')}
        {...register('nom')}
      />
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
  const { data: site } = useSite();
  usePageSeo('contact', site);
  if (!site) return null;
  const { email, liens, cv_url: cvUrl } = site.profil;
  const links = [
    { label: 'LinkedIn', url: liens.linkedin },
    { label: 'GitHub', url: liens.github },
  ].filter((link) => link.url);

  return (
    <>
      <PageIntro title={t('nav.contact')} lead={t('contact.lead')} />
      <PageSection light>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('contact.details')}</h2>
            <dl className="space-y-4">
              {email && (
                <div>
                  <dt className="text-muted text-sm">{t('contact.email')}</dt>
                  <dd>
                    <a className="text-accent text-lg underline" href={`mailto:${email}`}>
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
                      className="text-accent text-lg break-all underline"
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
              <a className="btn btn-primary" href={cvUrl} target="_blank" rel="noopener">
                {t('contact.downloadCv')}
              </a>
            )}
          </div>
          <ContactFormCard />
        </div>
      </PageSection>
    </>
  );
}
