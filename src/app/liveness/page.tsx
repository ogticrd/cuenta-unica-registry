import Image from 'next/image';

import { Typography, Box } from '@mui/material';

import { Steps } from '@/components/Steps';
import { getCookie } from '@/actions';
import { Form } from './form';

import Verification from '../../../public/assets/verification.svg';

export default async function LivenessPage() {
  const citizen = await getCookie('citizen');

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
        <Box sx={{ fontWeight: 'bold' }}>¡Hola {citizen?.name}!</Box>
        <Box>
          {' '}
          A continuación validaremos tu identidad mediante una verificación
          facial y prueba de vida. Asegúrate de cumplir con las siguientes
          condiciones:
        </Box>
      </Typography>
      <Form cedula={citizen?.id} />
    </div>
  );
}
