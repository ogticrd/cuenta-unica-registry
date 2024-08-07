'use client';

import Image from 'next/image';

import esicon from '@public/assets/es-language.svg';
import enicon from '@public/assets/en-language.svg';
import esdata from '../../dictionaries/es.json';
import endata from '../../dictionaries/en.json';

import { ButtonApp } from '@/components/elements/button';
import { useLanguage } from '@/app/[lang]/provider';

const locales = {
  es: {
    icon: esicon.src,
    name: esdata.languageName,
  },
  en: {
    icon: enicon.src,
    name: endata.languageName,
  },
};

export const LanguageSelector = () => {
  const { intl, locales: langs } = useLanguage();
  const other = langs.find((l) => l !== intl.language)!;

  const changeLanguage = () => {
    window.location.href = `/${other}/identification`;
  };

  return (
    <div style={{ marginRight: 16 }}>
      <ButtonApp
        variant="outlined"
        startIcon={
          <Image
            src={locales[other].icon}
            alt="language icon"
            width="24"
            height="24"
          />
        }
        onClick={changeLanguage}
      >
        {locales[other].name}
      </ButtonApp>
    </div>
  );
};
