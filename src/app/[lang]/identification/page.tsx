import { Box, Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import { getDictionary } from '@/dictionaries';
import { Steps } from '@/components/Steps';
import { SETTINGS_URL } from '@/common';
import { Locale } from '@/i18n-config';
import { session } from '@/common/lib';
import { Form } from './form';

type Props = { params: Promise<{ lang: Locale }> };

export default async function ValidationPage({ params }: Props) {
  const { lang } = await params;

  const [intl, user] = await Promise.all([getDictionary(lang), session()]);

  for (const addr of user.identity?.verifiable_addresses ?? []) {
    if (!addr.verified) redirect(`/confirmation?email=${addr.value}`);
  }

  if (user.active) {
    return redirect(SETTINGS_URL);
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Steps step={0} />

      <Box sx={{ my: 4 }}>
        <Typography
          color="primary"
          textAlign="center"
          fontWeight={500}
          fontSize="14px"
        >
          {intl.step1.description}
        </Typography>
      </Box>

      <Form />
    </Box>
  );
}
