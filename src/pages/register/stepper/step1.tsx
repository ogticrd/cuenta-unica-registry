import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useCallback, useState } from 'react';
import { useReCaptcha } from 'next-recaptcha-v3';
import { CitizensBasicInformationResponse } from '@/pages/api/types';
import axios from 'axios';
import * as yup from 'yup';

import { useSnackbar } from '@/components/elements/alert';
import {
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

const schema = yup.object({
  cedula: yup
    .string()
    .trim()
    .required('This field is required')
    .min(11, 'Debe contener 11 dígitos'),
});

export default function Step1({ setInfoCedula, handleNext }: any) {
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const cedulaValue = e.target.value
      .replace(/\D/g, '')
      .match(/(\d{0,3})(\d{0,7})(\d{0,1})/);
    e.target.value = !cedulaValue[2]
      ? cedulaValue[1]
      : `${cedulaValue[1]}-${cedulaValue[2]}${`${
          cedulaValue[3] ? `-${cedulaValue[3]}` : ''
        }`}${`${cedulaValue[4] ? `-${cedulaValue[4]}` : ''}`}`;
    const numbers = e.target.value.replace(/(\D)/g, '');
    setValue('cedula', numbers);
  };

  const {
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
  } = useForm<IFormInputs>({
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  // Import 'executeRecaptcha' using 'useReCaptcha' hook
  const { executeRecaptcha } = useReCaptcha();
  const { AlertError, AlertWarning } = useSnackbar();

  const handleSubmit = useCallback(
    async (data: IFormInputs) => {
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
          const response = await fetch(`/api/citizens/${data.cedula}`);
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
        AlertError('Parece que ha introducido una cédula inválida.');
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
      <br />
      <Typography variant="body1" align="center">
        Este es el primer paso para poder verificar tu identidad y crear tu
        cuenta ciudadana.
      </Typography>

      <form onSubmit={handleFormSubmit(handleSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Tooltip title="Para iniciar el proceso de validar tu identidad es necesario tu número de cédula.">
              <TextField
                required
                label="Número de Cédula"
                placeholder="***-**00000-0"
                onPaste={(e) => {
                  e.preventDefault();
                  return false;
                }}
                onCopy={(e) => {
                  e.preventDefault();
                  return false;
                }}
                autoComplete="off"
                onChange={(e) => handleChange(e)}
                error={Boolean(errors.cedula)}
                helperText={errors.cedula?.message}
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
