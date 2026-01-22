import { Typography, Box, Container, Alert } from '@mui/material';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';

import Verification from '@public/assets/verification.svg';

import { getDictionary } from '@/dictionaries';
import { getVidFlow } from './flow.action';
import { Locale } from '@/i18n-config';
import { Form } from './form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cuenta Única - Prueba de vida',
};

type Props = {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{
    flow?: string;
    redirect_uri?: string;
    access_token?: string;
    client_id?: string;
    state?: string;
    error?: string;
  }>;
};

export default async function VidPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const [intl, search] = await Promise.all([getDictionary(lang), searchParams]);

  // If validation error is present, display error message
  if (search.error) {
    const errorMessage = decodeURIComponent(search.error);
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            py: 4,
          }}
        >
          <Image src={Verification.src} alt="Logo" width="190" height="162" />
          <Typography
            color="primary"
            sx={{
              fontSize: '24px',
              fontWeight: '700',
              mt: 4,
              mb: 2,
            }}
          >
            {intl.errors.unknown}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              fontSize: '16px',
              mb: 4,
            }}
          >
            {intl.notFound.description}
          </Typography>

          <Alert severity="error" sx={{ mt: 4, maxWidth: '100%' }}>
            <Typography
              component="div"
              sx={{
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              {errorMessage}
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  // If OAuth params are present (no flow), redirect to API route for validation
  if (search.access_token && search.client_id && search.redirect_uri) {
    const params = new URLSearchParams({
      lang,
      access_token: search.access_token,
      client_id: search.client_id,
      redirect_uri: search.redirect_uri,
    });
    if (search.state) {
      params.set('state', search.state);
    }
    redirect(`/api/vid?${params.toString()}`);
  }

  // If flow ID is present, load from stored flow
  if (!search.flow) {
    return notFound();
  }

  const flowData = await getVidFlow(search.flow);

  if (!flowData) {
    return notFound();
  }

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Image src={Verification.src} alt="Logo" width="190" height="162" />
      </div>

      <Typography
        component="div"
        color="primary"
        textAlign="center"
        sx={{ my: 4, fontWeight: 500, fontSize: '14px' }}
      >
        <Box sx={{ fontWeight: 'bold' }}>
          ¡{intl.common.hello}, {flowData.citizenName}!
        </Box>
        <Box>{intl.step2.description}</Box>
      </Typography>

      <Form
        cedula={flowData.cedula}
        redirectUri={flowData.redirectUri}
        state={flowData.state}
      />
    </main>
  );
}
