import * as Sentry from '@sentry/nextjs';

import { version, name } from './package.json';

export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    debug: false,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',

    release: `${name}@${version}`,
  });
}
