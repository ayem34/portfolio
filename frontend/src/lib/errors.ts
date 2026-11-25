import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiError } from './api';

/** Traduit le code d'erreur renvoyé par l'API (ex. « code_invalide »). */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();
  return useCallback(
    (error) => {
      const code = error instanceof ApiError ? error.code : 'erreur_inconnue';
      return t(`errors.${code}`, { defaultValue: t('errors.erreur_inconnue') });
    },
    [t],
  );
}
