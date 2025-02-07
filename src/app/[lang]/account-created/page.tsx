import { Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import AccountCreated from '@public/assets/account-created.svg';
import becas from '@public/assets/becas.svg';
import gobdo from '@public/assets/gobdo.svg';
import soyyo from '@public/assets/soyyo.svg';
import styles from './page.module.css';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { TextBody } from '@/components/elements/typography';
import { getDictionary } from '@/dictionaries';
import { CitizenCookie } from '@/types';
import { Locale } from '@/i18n-config';
import { getCookie } from '@/actions';

type Props = { params: Promise<{ lang: Locale }> };

export default async function ConfirmationPage({ params }: Props) {
  const citizen = await getCookie<CitizenCookie>('citizen');
  const intl = await getDictionary((await params).lang);

  const sites = [
    {
      ready: true,
      name: 'gob.do',
      url: 'https://www.gob.do',
      description: intl.registered.descriptions.gobdo,
      icon: gobdo,
    },
    {
      ready: true,
      name: 'Soy Yo RD',
      url: 'https://soyyord.gob.do',
      description: intl.registered.descriptions.soyyo,
      icon: soyyo,
    },
    {
      ready: true,
      name: 'Beca tu Futuro',
      url: 'https://becas.gob.do',
      description: intl.registered.descriptions.becas,
      icon: becas,
    },
  ];

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
          {intl.registered.header.replace('{name}', citizen?.name || '')}
        </Typography>
        <TextBody textCenter gutterBottom>
          <span
            dangerouslySetInnerHTML={{
              __html: intl.registered.body.replace('{id}', citizen?.id || ''),
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
            {intl.registered.capabilities}
          </Typography>
        </div>
      </GridItem>

      {sites.map((site, index) => (
        <GridItem md={12} lg={12} key={index} sx={{ mt: 1 }}>
          <Link
            className={styles.listitem}
            href={site.ready ? site.url : '#'}
            target="_blank"
            aria-disabled={!site.ready}
            data-ready={site.ready}
          >
            <Image
              alt={site.name}
              width={110}
              height={60}
              src={site.icon?.src}
              className={styles.listimage}
            />
            <div className={styles.listcaption}>
              <Typography color="primary">
                <strong>{site.name}, </strong>
                <span style={{ opacity: '85%' }}>
                  {site.description.toLowerCase()}
                </span>
              </Typography>
            </div>
            {site.ready ? null : <span>{intl.registered.soon}</span>}
          </Link>
        </GridItem>
      ))}
    </GridContainer>
  );
}
