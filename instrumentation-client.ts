import * as Sentry from '@sentry/nextjs';

const { version, name } = require('./package.json');

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,

  enabled: process.env.NODE_ENV === 'production',

  environment: process.env.NEXT_PUBLIC_SENTRY_ENV,

  // release: `${process.env.npm_package_name}@${process.env.npm_package_version}`,
  release: `${name}@${version}`,

  replaysOnErrorSampleRate: 1.0,
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: false,
      blockAllMedia: true,
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
export const onRequestError = Sentry.captureRequestError;
