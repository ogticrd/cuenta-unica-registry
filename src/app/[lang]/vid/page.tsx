import { Typography, Box } from '@mui/material';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import Verification from '@public/assets/verification.svg';

import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';
import { Form } from './form';
import { createInputSchema } from './input.schema';

type Props = {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{
    redirect_uri?: string;
    access_token?: string;
    client_id?: string;
  }>;
};

export default async function VidPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const [intl, search] = await Promise.all([getDictionary(lang), searchParams]);

  const input = await createInputSchema(intl)
    .parseAsync(search)
    .catch((error) => {
      console.error('VID input validation failed', error);
      return notFound();
    });

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
          ¡{intl.common.hello}, {input.citizen.name}!
        </Box>
        <Box>{intl.step2.description}</Box>
      </Typography>

      <Form cedula={input.citizen.id} redirectUri={input.redirectUri} />
    </main>
  );
}
