import {
  Box,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Typography,
  Alert,
} from '@mui/material';
import SentimentSatisfiedOutlinedIcon from '@mui/icons-material/SentimentSatisfiedOutlined';
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import { useForm } from 'react-hook-form';
import { useCallback, useState } from 'react';

import { ButtonApp, ButtonTextApp } from '@/components/elements/button';
import { GridContainer, GridItem } from '@/components/elements/grid';
import {
  Step2Props,
  TermsAndConditionsInput,
} from '../../../common/interfaces';
import { useSnackAlert } from '@/components/elements/alert';
import Step2Modal from './step2Modal';
import { NON_ACCEPTED_TERMS_AND_CONDS_ERROR } from '@/constants';

export default function Step2({
  infoCedula,
  handleNext,
  handleReset,
}: Step2Props) {
  const [open, setOpen] = useState(false);
  const handleClick = useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, []);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<TermsAndConditionsInput>();
  const { AlertWarning } = useSnackAlert();

  const onSubmit = (data: TermsAndConditionsInput) => {
    if (!data.acceptTermAndConditions) {
      AlertWarning(NON_ACCEPTED_TERMS_AND_CONDS_ERROR);
      return;
    }

    handleClick();
  };

  return (
    <>
      <Typography
        component="div"
        color="primary"
        textAlign="center"
        sx={{ my: 4, fontSize: '16px' }}
      >
        <Box sx={{ fontWeight: 'bold' }}>¡Hola {infoCedula?.name}!</Box>
        <Box>
          {' '}
          A continuación validaremos tu identidad mediante una verificación
          facial y prueba de vida. Asegúrate de cumplir con las siguientes
          condiciones:
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

          <GridItem lg={12} md={12}>
            <br />
            <FormGroup>
              <FormControlLabel
                style={{ display: 'flex', justifyContent: 'center' }}
                control={
                  <Checkbox
                    color="error"
                    {...register('acceptTermAndConditions', { required: true })}
                  />
                }
                label={
                  // TODO: Add link to terms and conditions
                  <>
                    <a
                      // target="_blank"
                      // rel="noreferrer"
                      href="#"
                    >
                      Aceptar términos y políticas de privacidad
                    </a>{' '}
                    <span className="text-error">*</span>
                  </>
                }
              />
              {errors.acceptTermAndConditions && (
                <Alert severity="warning">
                  {NON_ACCEPTED_TERMS_AND_CONDS_ERROR}
                </Alert>
              )}
            </FormGroup>
          </GridItem>

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

        <br />
        <GridContainer>
          <GridItem md={12} lg={12}>
            <Box textAlign="center">
              <ButtonTextApp
                startIcon={<ArrowCircleLeftOutlinedIcon />}
                onClick={() => handleReset()}
              >
                Volver al paso anterior
              </ButtonTextApp>
            </Box>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
