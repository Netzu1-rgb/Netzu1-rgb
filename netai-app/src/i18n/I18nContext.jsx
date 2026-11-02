import React, { createContext, useContext, useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, isRTL } from './languages';
import { getTranslation } from './translations';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  // Determine initial language: localStorage > navigator.language > 'es'
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('netai_lang');
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }
    const navLang = navigator.language || navigator.userLanguage || 'es';
    const match = SUPPORTED_LANGUAGES.find(l => navLang.startsWith(l.code) || l.code === navLang);
    return match ? match.code : 'es';
  });

  // Units system: 'metric' (kg, g, cm) | 'imperial' (lbs, oz, in)
  const [units, setUnitsState] = useState(() => {
    return localStorage.getItem('netai_units') || 'metric';
  });

  // Update DOM dir & lang attributes on change
  useEffect(() => {
    localStorage.setItem('netai_lang', lang);
    const rtl = isRTL(lang);
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setLang = (newLangCode) => {
    if (SUPPORTED_LANGUAGES.some(l => l.code === newLangCode)) {
      setLangState(newLangCode);
    }
  };

  const setUnits = (newUnits) => {
    localStorage.setItem('netai_units', newUnits);
    setUnitsState(newUnits);
  };

  // Translation helper function
  const t = (key, params = {}) => {
    return getTranslation(lang, key, params);
  };

  // Number & Currency formatting with Intl
  const formatNumber = (num, options = {}) => {
    try {
      return new Intl.NumberFormat(lang, options).format(num);
    } catch (e) {
      return num.toString();
    }
  };

  // Date formatting with Intl
  const formatDate = (date, options = { weekday: 'short', month: 'short', day: 'numeric' }) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(lang, options).format(d);
    } catch (e) {
      return String(date);
    }
  };

  const value = {
    lang,
    setLang,
    isRTL: isRTL(lang),
    units,
    setUnits,
    t,
    formatNumber,
    formatDate,
    languages: SUPPORTED_LANGUAGES
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
