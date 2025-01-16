import { Typography } from '@mui/material';
import { redirect } from 'next/navigation';
import Image from 'next/image';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';
import { Counter } from './counter';

import AccountCreated from '@public/assets/account-created.svg';
import styles from './page.module.css';

type Props = {
  searchParams: Promise<{ cedula: string }>;
  params: Promise<{ lang: Locale }>;
};

export default async function RedirectionPage({ searchParams, params }: Props) {
  const intl = await getDictionary((await params).lang);
  const cedula = (await searchParams).cedula;

  if (!cedula) redirect('/identification');

  return (
    <GridContainer>
      <GridItem md={12} lg={12}>
        <div className={styles.center}>
          <Image
            src={AccountCreated?.src}
            alt="imagen de cuenta creada"
            width={259}
            height={225}
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
          {intl.redirection.title}
        </Typography>
        <TextBody textCenter gutterBottom>
          <span
            dangerouslySetInnerHTML={{
              __html: intl.redirection.body.replace('{id}', cedula),
            }}
          />
        </TextBody>
      </GridItem>

      <GridItem md={12} lg={12}>
        <div className={styles.center}>
          <Typography
            color="primary"
            fontWeight={500}
            fontSize="medium"
            bgcolor="#0091ff20"
            sx={{ px: 2, py: 1 }}
            borderRadius={2}
          >
            <Counter />
          </Typography>
        </div>
      </GridItem>
    </GridContainer>
  );
}
