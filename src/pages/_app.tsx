import type { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { theme } from '../themes';

import Layout from '../components/layout'

import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  </>
}
