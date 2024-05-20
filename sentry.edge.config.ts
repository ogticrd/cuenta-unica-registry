import * as Sentry from '@sentry/nextjs';

const { version, name } = require('./package.json');

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,

  enabled: process.env.NODE_ENV === 'production',

  debug: false,
  // release: `${process.env.npm_package_name}@${process.env.npm_package_version}`,
  release: `${name}@${version}`,
});
