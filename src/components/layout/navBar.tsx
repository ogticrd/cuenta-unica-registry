import AppsIcon from '@mui/icons-material/Apps';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';

import Logo from '@public/assets/logo.svg';
import styles from './styles.module.css';

import { LanguageSelector } from './languageSelector';
import { useLanguage } from '@/app/[lang]/provider';
import { ButtonApp } from '../elements/button';

export default function Index() {
  const { intl, locales } = useLanguage();

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/gh/opticrd/official-header/main.js"
        defer
      />
      <official-header></official-header>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          sx={{ boxShadow: '0px 1.5px 4px 0px #00000040' }}
        >
          <div style={{ width: '100%', maxWidth: '1400px', margin: 'auto' }}>
            <Toolbar sx={{ padding: '0px', height: '72px' }}>
              <div className={styles.logo}>
                <Link href={'/'}>
                  <Image src={Logo.src} alt="logo" width="105" height="52" />
                </Link>
              </div>
              <AppsIcon
                fontSize="large"
                color="primary"
                style={{ display: 'none' }}
              />
              <LanguageSelector
                other={locales.find((l) => l !== intl.language)!}
              />
              <ButtonApp
                notFullWidth
                onClick={() =>
                  window.open('https://mi.cuentaunica.gob.do/ui/login')
                }
              >
                {intl.actions.login}
              </ButtonApp>
            </Toolbar>
          </div>
        </AppBar>
      </Box>
    </>
  );
}
