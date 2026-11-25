import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { api } from '../lib/api';
import { useErrorMessage } from '../lib/errors';
import type { PublicProjetDetail } from '../lib/types';
import { Field, Honeypot, TextArea } from './FormFields';
import { PageSection } from './PageSection';

const requestSchema = z.object({
  nom: z.string().trim().min(1).max(120),
  entreprise: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  motif: z.string().trim().min(10).max(2000),
  site_web: z.string(),
});
type RequestForm = z.infer<typeof requestSchema>;

interface AccessGateProps {
  slug: string;
  onUnlocked: (projet: PublicProjetDetail) => void;
}

/**
 * Accès sur demande (section 4.6) : le visiteur saisit le code reçu par e-mail,
 * ou demande l'accès (nom, entreprise, e-mail, motif).
 */
export function AccessGate({ slug, onUnlocked }: AccessGateProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const base = `/public/projets/${encodeURIComponent(slug)}`;

  const codeForm = useForm<{ code: string }>({ defaultValues: { code: '' } });
  const unlock = useMutation({
    mutationFn: ({ code }: { code: string }) =>
      api.post<PublicProjetDetail>(`${base}/acces`, { code }),
    onSuccess: onUnlocked,
  });

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: { nom: '', entreprise: '', email: '', motif: '', site_web: '' },
  });
  const request = useMutation({
    mutationFn: (data: RequestForm) => api.post(`${base}/demandes-acces`, data),
    onSuccess: () => requestForm.reset(),
  });
  const { errors } = requestForm.formState;

  return (
    <PageSection title={t('access.title')} light>
      <p className="mb-8 max-w-3xl">{t('access.explanation')}</p>
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          className="card space-y-4 p-6"
          onSubmit={codeForm.handleSubmit((data) => unlock.mutate(data))}
        >
          <h3 className="text-xl font-semibold">{t('access.codeTitle')}</h3>
          <Field
            label={t('access.code')}
            hint={t('access.codeHint')}
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="XXXX-XXXX-XXXX"
            required
            minLength={4}
            {...codeForm.register('code')}
          />
          <button type="submit" className="btn btn-primary" disabled={unlock.isPending}>
            {t('access.unlock')}
          </button>
          {unlock.isPending && (
            <p className="text-muted text-sm" role="status">
              {t('contact.slowNotice')}
            </p>
          )}
          {unlock.isError && (
            <p className="field-error" role="alert">
              {errorMessage(unlock.error)}
            </p>
          )}
        </form>

        <form
          className="card relative space-y-4 p-6"
          onSubmit={requestForm.handleSubmit((data) => request.mutate(data))}
          noValidate
        >
          <h3 className="text-xl font-semibold">{t('access.requestTitle')}</h3>
          <Field
            label={t('contact.name')}
            autoComplete="name"
            error={errors.nom && t('contact.nameRequired')}
            {...requestForm.register('nom')}
          />
          <Field
            label={t('access.company')}
            autoComplete="organization"
            error={errors.entreprise && t('access.companyRequired')}
            {...requestForm.register('entreprise')}
          />
          <Field
            label={t('contact.email')}
            type="email"
            autoComplete="email"
            error={errors.email && t('contact.emailInvalid')}
            {...requestForm.register('email')}
          />
          <TextArea
            label={t('access.reason')}
            error={errors.motif && t('contact.messageTooShort')}
            {...requestForm.register('motif')}
          />
          <Honeypot {...requestForm.register('site_web')} />
          <button type="submit" className="btn btn-primary" disabled={request.isPending}>
            {t('access.request')}
          </button>
          {request.isPending && (
            <p className="text-muted text-sm" role="status">
              {t('contact.slowNotice')}
            </p>
          )}
          {request.isSuccess && (
            <p className="text-success font-medium" role="status">
              {t('access.requested')}
            </p>
          )}
          {request.isError && (
            <p className="field-error" role="alert">
              {errorMessage(request.error)}
            </p>
          )}
        </form>
      </div>
    </PageSection>
  );
}
