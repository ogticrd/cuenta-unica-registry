import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { AppProps } from 'next/app';
import { Amplify } from 'aws-amplify';
import { ReCaptchaProvider } from "next-recaptcha-v3";
import Head from 'next/head';

import Layout from '../components/layout';
import awsExports from '../aws-exports';
import { theme } from '../themes';

import '@aws-amplify/ui-react/styles.css';
import '@/styles/globals.css';

Amplify.configure(awsExports);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Plataforma Única de Autenticación</title>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
          <ReCaptchaProvider
            reCaptchaKey="6LeCFYMmAAAAABhOLfiTI7n9g1aV5kr6TfgpslIa"
            useEnterprise
          >
            <Component {...pageProps} />
          </ReCaptchaProvider>
        </Layout>
      </ThemeProvider>
    </>
  );
}
