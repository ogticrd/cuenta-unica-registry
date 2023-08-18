import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ReCaptchaProvider } from 'next-recaptcha-v3';
import { GoogleTagManagerBody, GoogleTagManagerHead } from '@thgh/next-gtm';

import { SnackbarProvider } from '../components/elements/alert';
import Layout from '../components/layout';
import { theme } from '../themes';

import '../../public/fonts/poppins_wght.css';
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
            <SnackbarProvider>
              <Layout>
                <ReCaptchaProvider useEnterprise>
                  {children}
                  {GoogleTagManagerBody}
                </ReCaptchaProvider>
              </Layout>
            </SnackbarProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
