import { Box, Typography } from '@mui/material';

import { getDictionary } from '@/dictionaries';
import { Steps } from '@/components/Steps';
import { Locale } from '@/i18n-config';
import { Form } from './form';

type Props = { params: { lang: Locale } };

export default async function ValidationPage({ params: { lang } }: Props) {
  const intl = await getDictionary(lang);

  return (
    <Box sx={{ width: '100%' }}>
      <Steps step={0} />
      <Typography component="div" color="primary" textAlign="center">
        <Box sx={{ fontWeight: 500, fontSize: '16px', my: 4 }}>
          {intl.step1.description}
        </Box>
      </Typography>

      <Form />
    </Box>
  );
}
