import { Typography } from '@mui/material';
import Image from 'next/image';

import { GridContainer, GridItem } from '@/components/elements/grid';
import Confirmation from '@public/assets/confirmation.svg';
import { getDictionary } from '@/dictionaries';
import { ConfirmationForm } from './form';
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
          Verificar correo electrónico
        </Typography>
      </GridItem>

      <GridItem md={12} lg={12}>
        <ConfirmationForm />
      </GridItem>
    </GridContainer>
  );
}
