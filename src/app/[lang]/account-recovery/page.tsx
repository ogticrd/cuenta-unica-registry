import { Box, Typography, Alert } from '@mui/material';
import { redirect } from 'next/navigation';

import { getDictionary } from '@/dictionaries';
import { SETTINGS_URL } from '@/common';
import { Locale } from '@/i18n-config';
import { session } from '@/common/lib';
import { Form } from './form';

type Props = { params: Promise<{ lang: Locale }> };

export default async function AccountRecoveryPage({ params }: Props) {
  const { lang } = await params;

  const [intl, user] = await Promise.all([getDictionary(lang), session()]);

  // If user is already logged in, redirect to settings
  if (user.active) {
    return redirect(SETTINGS_URL);
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ my: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          {intl.accountRecovery?.banner ||
            'Account Recovery Mode: You will need to verify your identity with a liveness check.'}
        </Alert>

        <Typography
          color="primary"
          textAlign="center"
          fontWeight={700}
          fontSize="20px"
          gutterBottom
        >
          {intl.accountRecovery?.title || 'Account Recovery'}
        </Typography>

        <Typography
          color="primary"
          textAlign="center"
          fontWeight={500}
          fontSize="14px"
        >
          {intl.accountRecovery?.description ||
            'If you forgot your email or need to change your credentials, enter your ID number to start the recovery process.'}
        </Typography>
      </Box>

      <Form />
    </Box>
  );
}
