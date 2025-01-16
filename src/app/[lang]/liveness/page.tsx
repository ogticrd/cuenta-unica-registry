import { Typography, Box } from '@mui/material';
import { redirect } from 'next/navigation';
import Image from 'next/image';

import Verification from '@public/assets/verification.svg';

import { fetchPhotoBuffer } from './get-photo.action';
import { getDictionary } from '@/dictionaries';
import { Steps } from '@/components/Steps';
import { CitizenCookie } from '@/types';
import { Locale } from '@/i18n-config';
import { getCookie } from '@/actions';
import { Form } from './form';

type Props = { params: Promise<{ lang: Locale }> };

export default async function LivenessPage({ params }: Props) {
  const citizen = await getCookie<CitizenCookie>('citizen');
  const intl = await getDictionary((await params).lang);

  if (!citizen?.name) return redirect('/identification');

  const photo = await fetchPhotoBuffer(citizen?.id);

  return (
    <div>
      <Steps step={1} />
      <br />
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
          ¡{intl.common.hello}, {citizen.name}!
        </Box>
        <Box>{photo ? intl.step2.description : intl.step2.unavailable}</Box>
      </Typography>

      {photo ? <Form cedula={citizen.id} /> : null}
    </div>
  );
}
