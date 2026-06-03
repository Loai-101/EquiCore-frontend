import i18n from './i18n';

const RTL_LANGS = new Set(['ar']);

/** Current resolved BCP-47-ish language code (e.g. en, ar). */
export function getCurrentLanguage() {
  const lng = i18n.resolvedLanguage || i18n.language || 'en';
  return String(lng).split('-')[0];
}

/** Text direction for a language (defaults to current i18n language). */
export function getTextDirection(lang = getCurrentLanguage()) {
  const code = String(lang).split('-')[0];
  return RTL_LANGS.has(code) ? 'rtl' : 'ltr';
}

/** Switch UI language; triggers i18n listeners and document dir update. */
export function switchLanguage(nextLang) {
  return i18n.changeLanguage(nextLang);
}

export function isRtlLanguage(lang = getCurrentLanguage()) {
  return getTextDirection(lang) === 'rtl';
}
