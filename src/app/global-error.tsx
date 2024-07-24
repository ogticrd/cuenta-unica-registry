'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
};

/**
 * This is the default Next.js  error component
 * but it doesn't allow omitting the statusCode
 * property yet.
 */
export default function GlobalError({ error }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={500} />
      </body>
    </html>
  );
}
