import { GoogleTagManagerBody, GoogleTagManagerHead } from '@thgh/next-gtm';
import { ReCaptchaProvider } from 'next-recaptcha-v3';
import type { Metadata } from 'next';
import React from 'react';

import BoxContentCenter from '@/components/elements/boxContentCenter';
import ThemeRegistry from '@/components/themes/ThemeRegistry';
import { CardAuth } from '@/components/elements/cardAuth';
import SnackAlert from '@/components/elements/alert';
import Layout from '../components/layout';

import LandingChica2 from '../../public/assets/landingChica.svg';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <html lang="es">
        <head>{GoogleTagManagerHead}</head>
        <body suppressHydrationWarning={true}>
          <ThemeRegistry>
            <Layout>
              <ReCaptchaProvider useEnterprise>
                <SnackAlert>
                  <BoxContentCenter>
                    <CardAuth
                      title="Registrar Cuenta Única Ciudadana"
                      landing={LandingChica2}
                      landingWidth={450}
                      landingHeight={400}
                    >
                      {children}
                    </CardAuth>
                  </BoxContentCenter>
                </SnackAlert>
                {GoogleTagManagerBody}
              </ReCaptchaProvider>
            </Layout>
          </ThemeRegistry>
        </body>
      </html>
    </>
  );
}
