import { Typography } from '@mui/material';
import Image from 'next/image';

import { GridContainer, GridItem } from '@/components/elements/grid';
import Confirmation from '@public/assets/confirmation.svg';
import { getDictionary } from '@/dictionaries';
import { ConfirmationForm } from './form';
import { Locale } from '@/i18n-config';

type Props = {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ email: string }>;
};

export default async function ConfirmationPage({
  params,
  searchParams,
}: Props) {
  const intl = await getDictionary((await params).lang);

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
          {intl.actions.verifyEmail}
        </Typography>
      </GridItem>

      <GridItem md={12} lg={12}>
        <ConfirmationForm defaultValue={(await searchParams).email} />
      </GridItem>
    </GridContainer>
  );
}
