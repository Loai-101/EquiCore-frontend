import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import i18n from '../utils/i18n';
import {
  getCurrentLanguage,
  getTextDirection,
  switchLanguage,
} from '../utils/i18nHelpers';

const LanguageContext = createContext(null);

/**
 * Thin language shell around i18next for components that prefer context
 * (mobile clients can mirror the same keys without coupling to React).
 */
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getCurrentLanguage);

  useEffect(() => {
    const onChange = (lng) => setLanguage(String(lng).split('-')[0]);
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, []);

  const dir = useMemo(() => getTextDirection(language), [language]);

  const changeLanguage = useCallback((lng) => switchLanguage(lng), []);

  const value = useMemo(
    () => ({
      language,
      dir,
      changeLanguage,
    }),
    [language, dir, changeLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
