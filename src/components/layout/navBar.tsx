import AppsIcon from '@mui/icons-material/Apps';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';

import Logo from '../../../public/assets/logo.svg';

export default function Index() {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/gh/opticrd/official-header/main.js"
        defer
      />
      <official-header></official-header>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <div style={{ width: '100%', maxWidth: '1400px', margin: 'auto' }}>
            <Toolbar sx={{ padding: '0px', height: '72px' }}>
              <div style={{ flexGrow: 1, paddingTop: '8px' }}>
                <Link
                  href={
                    '/'
                  }
                >
                  <Image src={Logo.src} alt="logo" width="200" height="48" />
                </Link>
              </div>
              <AppsIcon fontSize="large" />
            </Toolbar>
          </div>
        </AppBar>
      </Box>
    </>
  );
}
