import { Typography, Box } from '@mui/material';

import { Steps } from '@/components/Steps';
import { getCookie } from '@/actions';
import { Form } from './form';

export default async function RegisterPage() {
  const citizen = await getCookie('citizen');

  return (
    <div>
      <Steps step={2} />
      <Typography
        component="div"
        color="primary"
        textAlign="center"
        sx={{ my: 4, fontSize: '14px' }}
      >
        <Box sx={{ fontWeight: 500 }}>
          Para finalizar tu registro completa los siguientes campos:
        </Box>
      </Typography>
      <Form cedula={citizen?.id} />
    </div>
  );
}
