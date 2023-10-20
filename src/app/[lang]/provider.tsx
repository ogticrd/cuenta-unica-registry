'use client';
import { createContext, useContext } from 'react';

import { getDictionary } from '@/dictionaries';

type Props = {
  children: React.ReactNode;
  intl: Awaited<ReturnType<typeof getDictionary>>;
};

export function LanguageProvider({ children, intl }: Props) {
  const contextValue = {
    intl,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}

export const LanguageContext = createContext({} as Context);

export type Context = { intl: Props['intl'] };
