import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { AppProps } from 'next/app';
import { Amplify } from 'aws-amplify';
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import Head from 'next/head';
import getConfig from 'next/config';

import Layout from '../components/layout';
import awsExports from '../aws-exports';
import { theme } from '../themes';

import '@aws-amplify/ui-react/styles.css';
import '@/styles/globals.css';

Amplify.configure(awsExports);

const { publicRuntimeConfig } = getConfig();

export default function App({ Component, pageProps }: AppProps) {
  
  return (
    <>
      <Head>
        <title>Plataforma Única de Autenticación</title>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
          <GoogleReCaptchaProvider
            reCaptchaKey={publicRuntimeConfig.NEXT_PUBLIC_SITE_KEY}
            scriptProps={{
              async: false,
              defer: false,
              appendTo: "head",
              nonce: undefined,
            }}
          >
            <Component {...pageProps} />
          </GoogleReCaptchaProvider>
        </Layout>
      </ThemeProvider>
    </>
  );
}
