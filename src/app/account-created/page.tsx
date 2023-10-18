'use client';
import { TextField, Tooltip, Typography } from '@mui/material';

import Link from 'next/link';
import Image from 'next/image';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';

import AccountCreated from '../../../public/assets/account-created.svg';

export default async function ConfirmationPage() {
  return (
    <GridContainer>
      <GridItem md={12} lg={12}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src={AccountCreated?.src}
            alt="imagen de cuenta creada"
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
          ¡Felicidades tu Cuenta Única Ciudadana ha sido creada con éxito!
        </Typography>
        <TextBody textCenter gutterBottom>
          Ahora puedes ver y realizar tramites y  solicitar servicios gubernamentales con una sola cuenta y contraseña.
        </TextBody>
      </GridItem>

      <GridItem md={12} lg={12}>
        <ButtonApp
          onClick={() => window.open("https://mi.cuentaunica.gob.do/")}
        >Ir a mi cuenta</ButtonApp>
      </GridItem>
    </GridContainer>
  );
}
