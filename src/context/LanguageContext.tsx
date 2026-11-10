'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, LANGUAGE_OPTIONS, LanguageOption } from '@/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
  currentOption: LanguageOption;
  options: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load persisted language from localStorage safely on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('beautiful_gate_language') as Language;
      if (saved && (saved === 'en' || saved === 'zh' || saved === 'ms')) {
        setLanguageState(saved);
      }
    } catch {
      // Ignore localStorage errors in private browsing/SSR
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('beautiful_gate_language', newLang);
      document.documentElement.lang = newLang;
    } catch {
      // Ignore
    }
  };

  // Helper function to resolve nested dot-notation paths like 'brand.name' or 'nav.portal'
  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = translations[language] || translations.en;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if key missing in current language
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallbackCurrent: any = translations.en;
        for (const fbKey of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbKey in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fbKey];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackCurrent === 'string' ? fallbackCurrent : fallback || path;
      }
    }

    return typeof current === 'string' ? current : fallback || path;
  };

  const currentOption = LANGUAGE_OPTIONS.find((opt) => opt.code === language) || LANGUAGE_OPTIONS[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentOption,
        options: LANGUAGE_OPTIONS,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
