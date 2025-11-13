import { Typography, Box, Container } from '@mui/material';
import { headers } from 'next/headers';
import Image from 'next/image';

import NotFound404 from '@public/assets/not-found.svg';
import { getDictionary } from '@/dictionaries';
import { i18n, Locale } from '@/i18n-config';

export default async function NotFoundPage() {
  // Extract language from the pathname
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const langMatch = pathname.match(/^\/([^/]+)\//);
  const lang = langMatch?.[1] as Locale;

  const intl = await getDictionary(lang);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Image
          src={NotFound404?.src}
          alt="404 - Page not found"
          width={231}
          height={225}
          priority
        />

        <Typography
          color="primary"
          sx={{
            fontSize: '24px',
            fontWeight: '700',
            mt: 4,
            mb: 2,
          }}
        >
          {intl.notFound.title}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            fontSize: '16px',
            mb: 4,
          }}
        >
          {intl.notFound.description}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            fontSize: '14px',
            fontStyle: 'italic',
          }}
        >
          {intl.notFound.helpText}
        </Typography>
      </Box>
    </Container>
  );
}
