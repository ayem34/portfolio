import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_LANGUAGE, type Language } from '../i18n';
import type { LocalizedText } from './types';

export const EMPTY_TEXT: LocalizedText = { fr: '', en: '' };

/** Texte dans la langue demandée ; repli sur le français si la traduction est vide. */
export function localized(text: LocalizedText | null | undefined, language: Language): string {
  if (!text) return '';
  return text[language] || text[DEFAULT_LANGUAGE] || '';
}

export function useLanguage(): Language {
  const { i18n } = useTranslation();
  return i18n.language === 'en' ? 'en' : 'fr';
}

/** Renvoie une fonction `l(texte)` liée à la langue courante. */
export function useLocalized(): (text: LocalizedText | null | undefined) => string {
  const language = useLanguage();
  return useCallback((text) => localized(text, language), [language]);
}

export function formatDate(
  value: string | null | undefined,
  language: Language,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  if (!value) return '';
  return new Intl.DateTimeFormat(language, options).format(new Date(value));
}
