import { TextField, Tooltip, Typography } from '@mui/material';

import Link from 'next/link';
import Image from 'next/image';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';

import Code from '../../../public/assets/code.svg';

export default async function ConfirmationPage() {
  return (
    <GridContainer>
      <GridItem md={12} lg={12}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Image
            src={Code?.src}
            alt="imagen de código"
            width="177"
            height="196"
          />
        </div>
        <br />
        <Typography
          color="primary"
          sx={{
            fontSize: '24px',
            fontWeight: '700',
            textAlign: 'center',
          }}
          gutterBottom
        >
          Ingresa tu código de confirmación
        </Typography>
        <TextBody textCenter gutterBottom>
          Ingresa el código suministrado a tu correo electrónico, si no haz
          recibido ningún código confirma debajo tu correo electrónico.
        </TextBody>
        <br />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title="Código">
            <TextField
              required
              type="text"
              placeholder="0-0-0-0-0-0"
              autoComplete="off"
              sx={{ textAlign: 'center', width: '9em' }}
            />
          </Tooltip>
        </div>
        <br />
        <br />
      </GridItem>

      <GridItem md={12} lg={12}>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'center',
            color: '#ABAFB3',
          }}
          gutterBottom
        >
          Hemos enviado el código al siguiente correo:
        </Typography>
        <Tooltip title="Correo">
          <TextField
            required
            type="email"
            defaultValue="correo@confirmacion.com"
            autoComplete="off"
            fullWidth
          />
        </Tooltip>
        <br />
        <br />
        <ButtonApp variant="outlined">REENVIAR CORREO</ButtonApp>
      </GridItem>
    </GridContainer>
  );
}
