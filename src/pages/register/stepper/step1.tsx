import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useReCaptcha } from 'next-recaptcha-v3';
import { CitizensBasicInformationResponse } from '@/pages/api/types';
import axios from 'axios';
import { useSnackbar } from '@/components/elements/alert';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Backdrop,
  CircularProgress,
  Tooltip,
} from '@mui/material';
interface IFormInputs {
  cedula: string;
}

export default function Step1({ setInfoCedula, handleNext }: any) {
  const [loading, setLoading] = useState(false);

  const luhnCheck = (num: string) => {
    const arr = (num + '')
      .split('')
      .reverse()
      .map((x) => parseInt(x));
    const lastDigit = arr.splice(0, 1)[0];
    let sum = arr.reduce(
      (acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((2 * val) % 9) || 9),
      0
    );
    sum += lastDigit;
    return sum % 10 === 0;
  };

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<IFormInputs>({
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
  });

  const { executeRecaptcha } = useReCaptcha();
  const { AlertError, AlertWarning } = useSnackbar();

  const handleSubmit = useCallback(
    async (data: IFormInputs) => {
      const cleanCedula = data?.cedula?.replace(/-/g, '');
      if (cleanCedula?.length !== 11 || !luhnCheck(cleanCedula)) {
        AlertError('Por favor introduzca un número de cédula válido.');
        return;
      }
      setLoading(true);
      // Generate ReCaptcha token
      const token = await executeRecaptcha('form_submit');

      if (!token) {
        AlertWarning(
          'Problemas con el reCaptcha, intente nuevamente más tarde'
        );
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post('/api/recaptcha/assesments', {
          token,
        });
        if (response.data && response.data.isHuman === true) {
          const response = await fetch(`/api/citizens/${cleanCedula}`);
          if (response.status !== 200) {
            throw new Error('Failed to fetch citizen data');
          }
          const citizen: CitizensBasicInformationResponse =
            await response.json();
          setInfoCedula(citizen);
          handleNext();
        }
        if (response.data && response.data.isHuman === false) {
          AlertWarning(
            'No podemos validar si eres un humano, intenta desde otro navegador o dispositivo.'
          );
        }
      } catch (err) {
        console.error(err);
        AlertError('Esta cédula es correcta, pero no hemos podido validarla.');
      } finally {
        setLoading(false);
      }
    },
    [executeRecaptcha, handleNext, setInfoCedula, AlertWarning, AlertError]
  );

  return (
    <>
      <div>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
          <Typography variant="subtitle1">Validando cédula...</Typography>
        </Backdrop>
      </div>
      <Typography component="div" color="primary" textAlign="center" p={2}>
        <Box sx={{ fontWeight: 'bold' }}>
          Este es el primer paso para poder verificar tu identidad y crear tu
          cuenta ciudadana.
        </Box>
      </Typography>

      <form onSubmit={handleFormSubmit(handleSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Tooltip title="Para iniciar el proceso de validar tu identidad es necesario tu número de cédula.">
              <TextField
                {...register('cedula', { required: true })}
                required
                label="Número de Cédula"
                placeholder="***-**00000-0"
                autoComplete="off"
                error={Boolean(errors.cedula)}
                helperText={errors.cedula && 'Debe contener 11 dígitos'}
                fullWidth
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth>
              CONFIRMAR
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  );
}
