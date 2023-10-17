import { Typography, Box } from '@mui/material';
import { redirect } from 'next/navigation';

import { getDictionary } from '@/dictionaries';
import { Steps } from '@/components/Steps';
import { Locale } from '@/i18n-config';
import { getCookie } from '@/actions';
import { Form } from './form';

type Props = { params: { lang: Locale } };

export default async function LivenessPage({ params: { lang } }: Props) {
  const citizen = await getCookie('citizen');
  const intl = await getDictionary(lang);

  if (!citizen) return redirect('identification');

  return (
    <div>
      <Steps step={1} />
      <Typography
        component="div"
        color="primary"
        textAlign="center"
        sx={{ my: 4, fontSize: '16px' }}
      >
        <Box sx={{ fontWeight: 'bold' }}>
          ¡{intl.common.hello} {citizen.name}!
        </Box>
        <Box>{intl.step2.description}</Box>
      </Typography>

      <Form cedula={citizen.id} />
    </div>
  );
}
