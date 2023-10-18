import { TextField, Tooltip, Typography } from '@mui/material';

import Image from 'next/image';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';

import Confirmation from '../../../public/assets/confirmation.svg';

export default async function ConfirmationPage() {
  return (
    <GridContainer>
      <GridItem md={12} lg={12}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Image
            src={Confirmation?.src}
            alt="imagen de confirmación"
            width="259"
            height="225"
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
          Te hemos enviado un correo
        </Typography>
        <TextBody textCenter gutterBottom>
          Revisa tu <span>correo electrónico</span> y haz clic en el enlace de
          confirmación o utiliza el código de confirmación.
        </TextBody>
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
          Hemos enviado una confirmación al siguiente correo:
        </Typography>
        <Tooltip title="Correo personal">
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
        <ButtonApp>REENVIAR CORREO</ButtonApp>
      </GridItem>
    </GridContainer>
  );
}
