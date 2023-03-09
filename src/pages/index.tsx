import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { theme } from '../themes';

import Layout from '../components/layout'

import AuthHome from './auth/home'

export default function Home() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <AuthHome />
      </Layout>
    </ThemeProvider>
  )
}
