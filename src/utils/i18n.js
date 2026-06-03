import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../assets/locales/en/translation.json';
import ar from '../assets/locales/ar/translation.json';

const RTL_LANGS = new Set(['ar']);

function applyDocumentLanguage(lng) {
  const code = (lng || 'en').split('-')[0];
  const dir = RTL_LANGS.has(code) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', code);
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove('ltr', 'rtl');
    document.body.classList.add(dir);
  }
}

i18n.on('languageChanged', applyDocumentLanguage);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'equicore_i18nextLng',
    },
    react: { useSuspense: false },
  })
  .then(() => {
    applyDocumentLanguage(i18n.resolvedLanguage || i18n.language);
  });

export default i18n;
