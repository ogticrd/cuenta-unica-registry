'use client';

import { Typography } from '@mui/material';
import Image from 'next/image';

import AccountCreated from '@public/assets/account-created.svg';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';
import { useLanguage } from '@/app/[lang]/provider';

export default function ConfirmationPage() {
  const { intl } = useLanguage();

  return (
    <GridContainer>
      <GridItem md={12} lg={12}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
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
          {intl.registered.header}
        </Typography>
        <TextBody textCenter gutterBottom>
          {intl.registered.body}
        </TextBody>
      </GridItem>

      <GridItem md={12} lg={12}>
        <ButtonApp
          onClick={() => window.open('https://mi.cuentaunica.gob.do/ui/login')}
        >
          {intl.actions.myAccount}
        </ButtonApp>
      </GridItem>
    </GridContainer>
  );
}
