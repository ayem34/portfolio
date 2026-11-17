import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import fr from './fr.json';

export const LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'fr';
const STORAGE_KEY = 'portfolio-langue';

void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  // Toujours le français au premier rendu : c'est la langue des pages pré-générées.
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  initAsync: false,
});

function isLanguage(value: string | null): value is Language {
  return LANGUAGES.some((language) => language === value);
}

export function setLanguage(language: Language): void {
  void i18n.changeLanguage(language);
  document.documentElement.lang = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Stockage indisponible (navigation privée) : le choix vaut pour la page en cours.
  }
}

/** À appeler une fois la page affichée : applique la langue choisie lors d'une visite précédente. */
export function restoreLanguage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored) && stored !== i18n.language) setLanguage(stored);
  } catch {
    // Voir setLanguage.
  }
}

export default i18n;
