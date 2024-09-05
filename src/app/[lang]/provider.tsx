'use client';
import { createContext, use } from 'react';

import type { Dictionary } from '@/dictionaries';
import { i18n } from '@/i18n-config';

type Props = {
  children: React.ReactNode;
  intl: Dictionary;
};

export function LanguageProvider({ children, intl }: Props) {
  const contextValue = {
    intl,
    locales: i18n.locales,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = use(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}

export const LanguageContext = createContext({} as Context);

export type Context = {
  intl: Dictionary;
  locales: (typeof i18n)['locales'];
};
