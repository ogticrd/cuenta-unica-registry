import { Typography, Box } from '@mui/material';

import { Steps } from '@/components/Steps';
import { getCookie } from '@/actions';
import { Form } from './form';

export default async function LivenessPage() {
  const citizen = await getCookie('citizen');

  return (
    <div>
      <Steps step={1} />
      <Typography
        component="div"
        color="primary"
        textAlign="center"
        sx={{ my: 4, fontSize: '16px' }}
      >
        <Box sx={{ fontWeight: 'bold' }}>¡Hola {citizen.name}!</Box>
        <Box>
          {' '}
          A continuación validaremos tu identidad mediante una verificación
          facial y prueba de vida. Asegúrate de cumplir con las siguientes
          condiciones:
        </Box>
      </Typography>
      <Form cedula={citizen.id} />
    </div>
  );
}
