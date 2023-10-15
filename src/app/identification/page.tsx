import { Box, Typography } from '@mui/material';

import { Steps } from '@/components/Steps';
import { Form } from './form';

export default function ValidationPage() {
  return (
    <Box sx={{ width: '100%' }}>
      <Steps step={0} />
      <Typography component="div" color="primary" textAlign="center">
        <Box sx={{ fontWeight: 500, fontSize: '16px', my: 4 }}>
          Este es el primer paso para poder verificar tu identidad y crear tu
          cuenta ciudadana.
        </Box>
      </Typography>

      <Form />
    </Box>
  );
}
