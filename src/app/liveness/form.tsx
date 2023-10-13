'use client';

import {
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Box,
} from '@mui/material';
import SentimentSatisfiedOutlinedIcon from '@mui/icons-material/SentimentSatisfiedOutlined';
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';

import { ButtonApp, ButtonTextApp } from '@/components/elements/button';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { TermsValidationSchema } from '@/common/validation-schemas';
import { NON_ACCEPTED_TERMS_AND_CONDS_ERROR } from '@/common/constants';
import { LivenessModal } from '@/components/LivenessModal';

type TermsForm = z.infer<typeof TermsValidationSchema>;
type Props = {
  cedula: string;
};

export function Form({ cedula }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<TermsForm>();

  const onSubmit = handleSubmit(() => setOpen(true));

  return (
    <form onSubmit={onSubmit}>
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
                  {...register('accepted', { required: true })}
                />
              }
              label={
                <>
                  <Link target="_blank" href="/terms">
                    Aceptar términos y políticas de privacidad
                  </Link>{' '}
                  <span className="text-error">*</span>
                </>
              }
            />
            {errors.accepted && (
              <Alert severity="warning">
                {NON_ACCEPTED_TERMS_AND_CONDS_ERROR}
              </Alert>
            )}
          </FormGroup>
        </GridItem>

        <GridItem lg={12} md={12}>
          <ButtonApp submit>INICIAR PROCESO</ButtonApp>
          {open && <LivenessModal cedula={cedula} setOpen={setOpen} />}
        </GridItem>
      </GridContainer>

      <br />
      <GridContainer>
        <GridItem md={12} lg={12}>
          <Box textAlign="center">
            <ButtonTextApp
              startIcon={<ArrowCircleLeftOutlinedIcon />}
              onClick={router.back}
            >
              Volver al paso anterior
            </ButtonTextApp>
          </Box>
        </GridItem>
      </GridContainer>
    </form>
  );
}
