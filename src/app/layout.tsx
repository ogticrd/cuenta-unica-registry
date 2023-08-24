import React from 'react';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ReCaptchaProvider } from 'next-recaptcha-v3';
import { GoogleTagManagerBody, GoogleTagManagerHead } from '@thgh/next-gtm';

import Layout from '../components/layout';
import { theme } from '../themes';
import SnackAlert from '@/components/elements/alert';

import '../../public/fonts/poppins_wght.css';
import '@aws-amplify/ui-react/styles.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Cuenta Única - Registro',
  description: 'Plataforma de Registro para creación de tu Cuenta Única',
  keywords:
    'Cuenta Única, Registro, Plataforma de Autenticación, Gobierno Dominicano, República Dominicana',
  viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
};

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <html lang="es" className={roboto.className}>
        <head>{GoogleTagManagerHead}</head>
        <body>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Layout>
              <ReCaptchaProvider useEnterprise>
                <SnackAlert>{children}</SnackAlert>
                {GoogleTagManagerBody}
              </ReCaptchaProvider>
            </Layout>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
