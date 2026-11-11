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
    const resolvePath = (obj: any, p: string): string | undefined => {
      const keys = p.split('.');
      let current = obj;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return undefined;
        }
      }
      return typeof current === 'string' ? current : undefined;
    };

    const currentLangDict = translations[language] || translations.en;
    const enDict = translations.en;

    // 1. Direct path in current language
    let res = resolvePath(currentLangDict, path);
    if (res) return res;

    // 2. Cross-alias check: if path starts with 'admin.', check 'adminTable.' as well (and vice-versa)
    if (path.startsWith('admin.')) {
      res = resolvePath(currentLangDict, path.replace('admin.', 'adminTable.'));
      if (res) return res;
    } else if (path.startsWith('adminTable.')) {
      res = resolvePath(currentLangDict, path.replace('adminTable.', 'admin.'));
      if (res) return res;
    }

    // 3. Fallback to English dictionary
    res = resolvePath(enDict, path);
    if (res) return res;

    if (path.startsWith('admin.')) {
      res = resolvePath(enDict, path.replace('admin.', 'adminTable.'));
      if (res) return res;
    } else if (path.startsWith('adminTable.')) {
      res = resolvePath(enDict, path.replace('adminTable.', 'admin.'));
      if (res) return res;
    }

    return fallback || path;
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

