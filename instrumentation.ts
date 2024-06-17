import * as Sentry from '@sentry/nextjs';

const { version, name } = require('./package.json');

export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    debug: false,

    enabled: process.env.NODE_ENV === 'production',

    // release: `${process.env.npm_package_name}@${process.env.npm_package_version}`,
    release: `${name}@${version}`,
  });
}
