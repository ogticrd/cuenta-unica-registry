import * as Sentry from '@sentry/nextjs';

import { version, name } from '../package.json';
import { filterRegistryMetric } from '@/common/helpers/sentry-metrics';
import {
  sentryDataCollection,
  sentryTunnelPath,
} from '@/common/helpers/sentry-options';

export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.65,
    beforeSendMetric: filterRegistryMetric,
    dataCollection: sentryDataCollection,
    debug: false,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV,
    enabled: process.env.NODE_ENV === 'production',
    release: `${name}@${version}`,
    integrations: [Sentry.serveTunnelIntegration({ path: sentryTunnelPath })],
  });
}

export const onRequestError = Sentry.captureRequestError;
