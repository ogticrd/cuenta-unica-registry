import * as Sentry from '@sentry/nextjs';

const { version: release } = require('./package.json');

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,
  release,
});
