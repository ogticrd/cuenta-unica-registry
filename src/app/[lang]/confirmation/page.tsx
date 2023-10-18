import { Typography } from '@mui/material';
import Link from 'next/link';

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
        <br />
        <Typography
          color="primary"
          sx={{
            fontSize: '24px',
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {intl.registered.header}
        </Typography>
        <br />
        <TextBody textCenter>{intl.registered.body}</TextBody>
        <br />
      </GridItem>

      <GridItem md={12} lg={12}>
        <TextBody textCenter bold>
          {intl.registered.feedback.title}
        </TextBody>
        <br />
        <Link href="https://forms.gle/cQnxx6UEpFHrLx2t7'">
          <ButtonApp>{intl.registered.feedback.link}</ButtonApp>
        </Link>
      </GridItem>
    </GridContainer>
  );
}
