import Head from 'next/head';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { Amplify } from 'aws-amplify';
import { ReCaptchaProvider } from 'next-recaptcha-v3';
import TagManager from 'react-gtm-module';

import { SnackbarProvider } from '../components/elements/alert';
import Layout from '../components/layout';
import awsExports from '../aws-exports';
import { theme } from '../themes';

import '@aws-amplify/ui-react/styles.css';
import '@/styles/globals.css';

Amplify.configure(awsExports);

export default function App({ Component, pageProps }: AppProps) {
  // Google Tag Manager
  useEffect(() => {
    TagManager.initialize({
      gtmId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS as string,
    });
  }, []);
  return (
    <>
      <Head>
        <title>Plataforma Única de Autenticación</title>
        <meta
          name="description"
          content="Plataforma Única de Autenticación Ciudadana"
        />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <Layout>
            <ReCaptchaProvider useEnterprise>
              <Component {...pageProps} />
            </ReCaptchaProvider>
          </Layout>
        </SnackbarProvider>
      </ThemeProvider>
    </>
  );
}
