import * as Sentry from '@sentry/nextjs';

import { version, name } from '../package.json';

export function register() {
  const bunVersion =
    process.env.NEXT_RUNTIME === 'nodejs' ? process.versions.bun : undefined;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.65,
    enableLogs: true,
    sendDefaultPii: false,
    debug: false,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV,
    enabled: process.env.NODE_ENV === 'production',
    release: `${name}@${version}`,
    integrations: bunVersion
      ? [
          {
            name: 'BunRuntimeContext',
            processEvent(event) {
              event.contexts = {
                ...event.contexts,
                runtime: { name: 'bun', version: bunVersion },
              };
              return event;
            },
          },
        ]
      : [],
  });
}

export const onRequestError = Sentry.captureRequestError;
