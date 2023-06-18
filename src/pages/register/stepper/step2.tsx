import SentimentSatisfiedOutlinedIcon from '@mui/icons-material/SentimentSatisfiedOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import * as yup from 'yup';

import Grid from '@mui/material/Grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Step2Modal from './step2Modal';

import { useSnackbar } from '@/components/elements/alert';

interface IFormInputs {
  acceptTermAndConditions: boolean;
}

const schema = yup.object().shape({
  acceptTermAndConditions: yup
    .boolean()
    .required('Required field')
    .default(false),
});

export default function Step2({ infoCedula, handleNext }: any) {
  const [open, setOpen] = useState(false);

  const handleClick = () => setOpen(!open);

  const { handleSubmit, setValue } = useForm<IFormInputs>({
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const { AlertError } = useSnackbar();

  const onSubmit = (data: IFormInputs) => {
    if (!data.acceptTermAndConditions) {
      AlertError(
        'Para continuar debe aceptar Términos y Políticas de Privacidad'
      );
      return;
    }
    handleClick();
  };

  return (
    <>
      <br />
      <Typography align="center">
        ¡Hola {infoCedula?.name}!{' '}
        <span style={{ fontWeight: '400' }}>
          Ahora vamos a validar tu identidad mediante una verificación facial
          para continuar con tu registro. Asegúrate de cumplir con lo siguiente:
        </span>
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <div
              style={{
                background: '#EFF7FF',
                borderRadius: '6px',
                padding: '30px 20px',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'row',
              }}
            >
              <CameraAltOutlinedIcon
                sx={{ fontSize: '45px', marginRight: '12px' }}
                color="info"
              />
              <Typography variant="body2" color="primary">
                Tener disponible un teléfono móvil o computadora con{' '}
                <span style={{ fontWeight: 'bold' }}>cámara</span> integrada.
              </Typography>
            </div>
          </Grid>

          <Grid item xs={12}>
            <div
              style={{
                background: '#EFF7FF',
                borderRadius: '6px',
                padding: '30px 20px',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'row',
              }}
            >
              <SentimentSatisfiedOutlinedIcon
                sx={{ fontSize: '45px', marginRight: '12px' }}
                color="info"
              />
              <Typography variant="body2" color="primary">
                Estar de acuerdo en que hagamos capturas de{' '}
                <span style={{ fontWeight: 'bold' }}>tu rostro.</span>
              </Typography>
            </div>
          </Grid>

          <br />
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox color="error" />}
                onChange={(e: any) => {
                  setValue('acceptTermAndConditions', e.target.checked);
                }}
                label={
                  // TODO: Add link to terms and conditions
                  <a target="_blank" rel="noreferrer" href="">
                    Aceptar Términos y Políticas de Privacidad{' '}
                    <span className="text-error">*</span>
                  </a>
                }
              />
            </FormGroup>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth>
              INICIAR PROCESO
            </Button>
            {open && (
              <Step2Modal
                open={open}
                handleClick={handleClick}
                handleNextForm={handleNext}
                identity={infoCedula.id}
              />
            )}
          </Grid>
        </Grid>
      </form>
    </>
  );
}
