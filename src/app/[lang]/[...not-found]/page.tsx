import { Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { ButtonApp } from '@/components/elements/button';
import NotFound404 from '@public/assets/not-found.svg';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';

type Props = { params: Promise<{ lang: Locale }> };

export default async function NotFound({ params }: Props) {
  const { lang } = await params;
  const intl = await getDictionary(lang);

  return (
    <GridContainer>
      <GridItem md={12} lg={12}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Image
            src={NotFound404?.src}
            alt="img 404"
            width="231"
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
          {intl.notFound.title}
        </Typography>
        <TextBody textCenter gutterBottom>
          {intl.notFound.description}
        </TextBody>
      </GridItem>

      <GridItem md={12} lg={12}>
        <Link href={`/${lang}/identification`}>
          <ButtonApp>{intl.notFound.returnHome}</ButtonApp>
        </Link>
      </GridItem>
    </GridContainer>
  );
}
