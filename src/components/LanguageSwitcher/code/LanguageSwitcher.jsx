import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '../../../utils/i18nHelpers';
import '../styles/LanguageSwitcher.css';

const LANGS = [
  { code: 'en', labelKey: 'languageSwitcher.english', shortKey: 'languageSwitcher.enShort' },
  { code: 'ar', labelKey: 'languageSwitcher.arabic', shortKey: 'languageSwitcher.arShort' },
];

/**
 * Compact EN/AR toggle; extend LANGS when new locales ship.
 */
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = getCurrentLanguage();

  return (
    <div className="ec-lang-switcher" role="group" aria-label={t('languageSwitcher.ariaLabel')}>
      {LANGS.map(({ code, labelKey, shortKey }) => (
        <button
          key={code}
          type="button"
          className={`ec-lang-switcher__btn${current === code ? ' ec-lang-switcher__btn--active' : ''}`}
          onClick={() => i18n.changeLanguage(code)}
          aria-pressed={current === code}
          title={t(labelKey)}
        >
          {t(shortKey)}
        </button>
      ))}
    </div>
  );
}
