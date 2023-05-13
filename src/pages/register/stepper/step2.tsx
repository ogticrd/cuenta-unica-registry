import SentimentSatisfiedOutlinedIcon from '@mui/icons-material/SentimentSatisfiedOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import * as yup from 'yup';

import { GridContainer, GridItem } from '@/components/elements/grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import { TextBody } from '@/components/elements/typography';
import { AlertWarning } from '@/components/elements/alert';
import { ButtonApp } from '@/components/elements/button';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import { labels } from '@/constants/labels';
import { Typography } from '@mui/material';
import Step2Modal from './step2Modal';

interface IFormInputs {
  acceptTermAndConditions: boolean;
}

const schema = yup.object({
  acceptTermAndConditions: yup
    .boolean()
    .required(labels.form.requiredField)
    .default(false),
});

export default function Step2({ infoCedula, handleNext }: any) {
  const [open, setOpen] = useState(false);

  const handleClick = () => setOpen(!open);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<IFormInputs>({
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: IFormInputs) => {
    if (!data.acceptTermAndConditions) {
      return AlertWarning(
        'Para continuar debe aceptar Términos y Políticas de Privacidad'
      );
    }
    handleClick();
  };

  return (
    <>
      <br />
      <TextBody textCenter>
        ¡Hola {infoCedula?.name}!{' '}
        <span style={{ fontWeight: '400' }}>
          Ahora vamos a verificar tu identidad mediante autenticación biométrica
          y continuar con el proceso de tú registro, asegúrate de disponer de
          los siguientes elementos:
        </span>
      </TextBody>
      <br />

      <form onSubmit={handleSubmit(onSubmit)}>
        <GridContainer marginY>
          <GridItem md={12} lg={12}>
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
          </GridItem>

          <GridItem md={12} lg={12}>
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
                Permitir capturas de{' '}
                <span style={{ fontWeight: 'bold' }}>
                  fotografías de tu rostro.
                </span>
              </Typography>
            </div>
          </GridItem>

          <GridItem md={12} lg={12}>
            <Typography
              color="primary"
              sx={{ fontSize: '16px', fontWeight: '400', textAlign: 'center' }}
            >
              Verificación con pasaporte disponible próximamente
            </Typography>
          </GridItem>
          <br />
          <br />
          <GridItem md={12} lg={12}>
            <FormGroup sx={{ display: 'flex', alignContent: 'center' }}>
              <FormControlLabel
                onChange={(e: any) => {
                  setValue('acceptTermAndConditions', e.target.checked);
                }}
                control={<Checkbox color="error" />}
                label={
                  <a target="_blank" rel="noreferrer" href="">
                    Aceptar Términos y Políticas de Privacidad{' '}
                    <span className="text-error">*</span>
                  </a>
                }
              />
            </FormGroup>
          </GridItem>
        </GridContainer>

        <GridContainer marginY>
          <GridItem md={12} lg={12}>
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
