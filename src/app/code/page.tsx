import { TextField, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';

import Code from '@public/assets/code.svg';

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
          {intl.code.title}
        </Typography>
        <TextBody textCenter gutterBottom>
          {intl.code.body}
        </TextBody>
        <br />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={intl.code.tooltip}>
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
          {intl.code.sent}
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
        <ButtonApp variant="outlined">{intl.actions.resendEmail}</ButtonApp>
      </GridItem>
    </GridContainer>
  );
}
