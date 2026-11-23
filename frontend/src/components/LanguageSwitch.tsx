import { useTranslation } from 'react-i18next';

import { type Language, LANGUAGES, setLanguage } from '../i18n';
import { useLanguage } from '../lib/localized';

/** Bouton de langue FR / EN. Le choix est mémorisé dans le navigateur. */
export function LanguageSwitch() {
  const { t } = useTranslation();
  const current = useLanguage();
  return (
    <div className="flex gap-1" role="group" aria-label={t('language.label')}>
      {LANGUAGES.map((language: Language) => (
        <button
          key={language}
          type="button"
          lang={language}
          className={`min-h-9 rounded-full px-3 text-sm font-semibold uppercase ${language === current ? 'bg-accent text-on-accent' : 'text-muted hover:text-fg'}`}
          aria-pressed={language === current}
          onClick={() => setLanguage(language)}
          title={t(`language.${language}`)}
        >
          {language}
        </button>
      ))}
    </div>
  );
}
