import { afterEach, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import {
  sentryDataCollection,
  sentryTunnelPath,
} from '@/common/helpers/sentry-options';

vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  serveTunnelIntegration: vi.fn(() => ({ name: 'ServeTunnel' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
  captureRequestError: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

it('does not read server process versions in the Edge runtime', async () => {
  vi.stubEnv('NEXT_RUNTIME', 'edge');
  vi.spyOn(process, 'versions', 'get').mockImplementation(() => {
    throw new Error('process.versions is unavailable in Edge');
  });
  const { register } = await import('@/instrumentation');
  expect(() => register()).not.toThrow();
  expect(Sentry.serveTunnelIntegration).toHaveBeenCalledWith({
    path: sentryTunnelPath,
  });
});

it.each(['production', 'development'])(
  'configures logs in both runtimes for %s',
  async (mode) => {
    vi.stubEnv('NODE_ENV', mode);
    const server = await import('@/instrumentation');
    server.register();
    const client = await import('@/instrumentation-client');

    expect(Sentry.init).toHaveBeenCalledTimes(2);
    expect(vi.mocked(Sentry.init).mock.calls[0][0]).toMatchObject({
      beforeSendMetric: expect.any(Function),
    });
    for (const [options] of vi.mocked(Sentry.init).mock.calls) {
      expect(options).toMatchObject({
        enabled: mode === 'production',
        dataCollection: sentryDataCollection,
        tracesSampleRate: 0.65,
      });
      expect(options?.sampleRate).toBeUndefined();
      expect(options).not.toHaveProperty('enableLogs');
      expect(options).not.toHaveProperty('enableMetrics');
      expect(options).not.toHaveProperty('sendDefaultPii');
    }
    expect(vi.mocked(Sentry.init).mock.calls[1][0]?.tunnel).toEqual({
      path: sentryTunnelPath,
    });
    expect(server.onRequestError).toBe(Sentry.captureRequestError);
    expect(client.onRouterTransitionStart).toBe(
      Sentry.captureRouterTransitionStart,
    );
  },
);
