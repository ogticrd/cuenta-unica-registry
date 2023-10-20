import { TextField, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';

import Confirmation from '@public/assets/confirmation.svg';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';

type Props = { params: { lang: Locale } };

export default async function ConfirmationPage({ params: { lang } }: Props) {
  const intl = await getDictionary(lang);

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
          {intl.confirmation.title}
        </Typography>
        <TextBody textCenter gutterBottom>
          {intl.confirmation.subtitle}
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
          {intl.confirmation.emailSent}
        </Typography>
        <Tooltip title={intl.step3.email.tooltip}>
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
        <ButtonApp>{intl.actions.resendEmail}</ButtonApp>
      </GridItem>
    </GridContainer>
  );
}
