import { GoogleTagManagerBody, GoogleTagManagerHead } from '@thgh/next-gtm';
import { ReCaptchaProvider } from 'next-recaptcha-v3';
import type { Metadata } from 'next';
import React from 'react';

import ThemeRegistry from '@/components/themes/ThemeRegistry';
import SnackAlert from '@/components/elements/alert';
import Layout from '../components/layout';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <html lang="es">
        <head>{GoogleTagManagerHead}</head>
        <body>
          <ThemeRegistry>
            <Layout>
              <ReCaptchaProvider useEnterprise>
                <SnackAlert>{children}</SnackAlert>
                {GoogleTagManagerBody}
              </ReCaptchaProvider>
            </Layout>
          </ThemeRegistry>
        </body>
      </html>
    </>
  );
}
