import AppsIcon from '@mui/icons-material/Apps';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Image from 'next/image';
import Link from 'next/link';

import Logo from '@public/assets/logo.svg';
import styles from './styles.module.css';

import { LanguageSelector } from './languageSelector';
import type { getDictionary } from '@/dictionaries';
import { ButtonApp } from '../elements/button';
import { LOGIN_URL } from '@/common';

type Props = { intl: Awaited<ReturnType<typeof getDictionary>> };

export default async function NavBar({ intl }: Props) {
  return (
    <nav>
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
                <Link href={`/${intl.language}/identification`}>
                  <Image src={Logo.src} alt="logo" width="105" height="52" />
                </Link>
              </div>
              <AppsIcon
                fontSize="large"
                color="primary"
                style={{ display: 'none' }}
              />

              <LanguageSelector />

              <Link href={LOGIN_URL} target="_blank">
                <ButtonApp notFullWidth>{intl.actions.login}</ButtonApp>
              </Link>
            </Toolbar>
          </div>
        </AppBar>
      </Box>
    </nav>
  );
}
