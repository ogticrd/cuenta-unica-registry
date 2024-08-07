import { Box, Typography } from '@mui/material';
import { redirect } from 'next/navigation';
import type { Session } from '@ory/client';
import { cookies } from 'next/headers';

import { getDictionary } from '@/dictionaries';
import { Steps } from '@/components/Steps';
import { SETTINGS_URL } from '@/common';
import { Locale } from '@/i18n-config';
import { ory } from '@/common/lib/ory';
import { Form } from './form';

type Props = { params: { lang: Locale } };

export default async function ValidationPage({ params: { lang } }: Props) {
  const intl = await getDictionary(lang);

  const cookie = cookies()
    .getAll()
    .find((key) => key.name.includes('ory_session'));

  const user: Session = await ory
    .toSession({ cookie: `${cookie?.name}=${cookie?.value}` })
    .then((resp) => resp.data)
    .catch(() => ({}) as Session);

  if (user.identity?.verifiable_addresses?.find((id) => !id.verified)) {
    // console.log('NO VERIFICADO');
  } else if (user.active) {
    // Donde deberia ir si ya está creada
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
