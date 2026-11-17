import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { LanguageSwitch } from '../../components/LanguageSwitch';
import { api } from '../../lib/api';
import type { AdminSession } from '../../lib/types';
import { TextField } from '../components/form';
import { SESSION_KEY, useErrorMessage } from '../hooks';

const schema = z.object({
  email: z.string().email(),
  mot_de_passe: z.string().min(1),
});
type LoginForm = z.infer<typeof schema>;

export default function Login() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const { register, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });
  const login = useMutation({
    mutationFn: (data: LoginForm) => api.post<AdminSession>('/auth/connexion', data),
    onSuccess: (session) => queryClient.setQueryData(SESSION_KEY, session),
  });

  return (
    <main className="container-page flex min-h-screen flex-col items-center justify-center py-12">
      <form
        className="card w-full max-w-md space-y-5 p-6 sm:p-8"
        onSubmit={handleSubmit((data) => login.mutate(data))}
        noValidate
      >
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('admin.login.title')}</h1>
          <LanguageSwitch />
        </div>
        <TextField
          label={t('admin.login.email')}
          type="email"
          autoComplete="username"
          error={formState.errors.email && t('admin.login.emailInvalid')}
          {...register('email')}
        />
        <TextField
          label={t('admin.login.password')}
          type="password"
          autoComplete="current-password"
          error={formState.errors.mot_de_passe && t('admin.required')}
          {...register('mot_de_passe')}
        />
        {login.isError && (
          <p className="field-error" role="alert">
            {errorMessage(login.error)}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={login.isPending}>
          {t('admin.login.submit')}
        </button>
      </form>
    </main>
  );
}
