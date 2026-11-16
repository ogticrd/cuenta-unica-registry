import { afterEach, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';

vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
  captureRequestError: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

it.each(['production', 'development'])(
  'configures logs in both runtimes for %s',
  async (mode) => {
    vi.stubEnv('NODE_ENV', mode);
    const server = await import('@/instrumentation');
    server.register();
    const client = await import('@/instrumentation-client');

    expect(Sentry.init).toHaveBeenCalledTimes(2);
    for (const [options] of vi.mocked(Sentry.init).mock.calls) {
      expect(options).toMatchObject({
        enableLogs: true,
        enabled: mode === 'production',
        sendDefaultPii: false,
        tracesSampleRate: 0.65,
      });
      expect(options?.sampleRate).toBeUndefined();
    }
    expect(server.onRequestError).toBe(Sentry.captureRequestError);
    expect(client.onRouterTransitionStart).toBe(
      Sentry.captureRouterTransitionStart,
    );
  },
);
