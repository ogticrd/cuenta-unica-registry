import * as Sentry from '@sentry/nextjs';

const { version, name } = require('./package.json');

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,

  // release: `${process.env.npm_package_name}@${process.env.npm_package_version}`,
  release: `${name}@${version}`,

  replaysOnErrorSampleRate: 1.0,
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    new Sentry.Replay({
      // Additional Replay configuration goes in here, for example:
      maskAllText: false,
      blockAllMedia: true,
    }),
  ],
});
