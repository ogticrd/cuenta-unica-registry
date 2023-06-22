import SentimentSatisfiedOutlinedIcon from '@mui/icons-material/SentimentSatisfiedOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import { useForm } from 'react-hook-form';
import { useCallback, useState } from 'react';

import {
  Box,
  Button,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Grid,
  Typography,
} from '@mui/material';
import Step2Modal from './step2Modal';

import { useSnackbar } from '@/components/elements/alert';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { ButtonApp } from '@/components/elements/button';

interface IFormInputs {
  acceptTermAndConditions: boolean;
}

interface IStep2Props {
  infoCedula: { [key: string]: any };
  handleNext: () => void;
}

export default function Step2({ infoCedula, handleNext }: IStep2Props) {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, []);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<IFormInputs>();

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
      <Typography component="div" color="primary" textAlign="center" p={2}>
        <Box sx={{ fontWeight: 'bold' }}>¡Hola {infoCedula?.name}!</Box>
        <Box>
          {' '}
          Ahora vamos a validar tu identidad mediante una verificación facial y
          una prueba de vida. Asegúrate de cumplir con lo siguiente:
        </Box>
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <GridContainer>
          <GridItem lg={6} md={6}>
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
                Utilizar un dispositivo que posea{' '}
                <span style={{ fontWeight: 'bold' }}>cámara</span> integrada.
              </Typography>
            </div>
          </GridItem>

          <GridItem lg={6} md={6}>
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
                Permitir que tomemos capturas de{' '}
                <span style={{ fontWeight: 'bold' }}>tu rostro.</span>
              </Typography>
            </div>
          </GridItem>

          <br />
          <GridItem lg={12} md={12}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    color="error"
                    {...register('acceptTermAndConditions', { required: true })}
                  />
                }
                label={
                  // TODO: Add link to terms and conditions
                  <a target="_blank" rel="noreferrer" href="">
                    Aceptar Términos y Políticas de Privacidad{' '}
                    <span className="text-error">*</span>
                  </a>
                }
              />
              {errors.acceptTermAndConditions && (
                <Typography color="error">
                  Para continuar debe aceptar Términos y Políticas de Privacidad
                </Typography>
              )}
            </FormGroup>
          </GridItem>
        </GridContainer>
        <br />

        <GridContainer spacing={3}>
          <GridItem lg={12} md={12}>
            <ButtonApp submit>INICIAR PROCESO</ButtonApp>
            {open && (
              <Step2Modal
                open={open}
                handleClick={handleClick}
                handleNextForm={handleNext}
                identity={infoCedula.id}
              />
            )}
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
