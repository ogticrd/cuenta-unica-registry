import { afterEach, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { NodeClient } from '@sentry/node';
import { Scope } from '@sentry/core';
import type { Envelope, Event, Integration } from '@sentry/core';

vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
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

it.each(['error', 'transaction'] as const)(
  'reports Bun in the actual SDK %s envelope while preserving other context',
  async (eventType) => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.spyOn(process, 'versions', 'get').mockReturnValue({
      ...process.versions,
      bun: '1.4.4',
    });
    const { register } = await import('@/instrumentation');
    register();
    const options = vi.mocked(Sentry.init).mock.calls[0][0]!;
    const envelopes: Envelope[] = [];
    const client = new NodeClient({
      ...options,
      dsn: 'https://public@example.test/1',
      enabled: true,
      tracesSampleRate: 1,
      integrations: options.integrations as Integration[],
      stackParser: () => [],
      transport: () => ({
        send: async (envelope) => {
          envelopes.push(envelope);
          return { statusCode: 200 };
        },
        flush: async () => true,
      }),
    });
    client.init();
    try {
      client.captureEvent(
        {
          ...(eventType === 'transaction'
            ? {
                type: 'transaction',
                transaction: 'runtime-probe',
                start_timestamp: 1,
                timestamp: 2,
              }
            : { message: 'runtime-probe' }),
          contexts: { app: { app_version: 'test' } },
        },
        {},
        new Scope(),
      );
      expect(await client.flush(2000)).toBe(true);
      const events = envelopes.flatMap(([, items]) =>
        items
          .filter(
            ([header]) =>
              header.type === (eventType === 'error' ? 'event' : 'transaction'),
          )
          .map(([, payload]) => payload as Event),
      );
      expect(events).toHaveLength(1);
      expect(events[0].contexts).toMatchObject({
        runtime: { name: 'bun', version: '1.4.4' },
        app: { app_version: 'test' },
      });
    } finally {
      await client.close(2000);
    }
  },
);

it.each(['nodejs', 'edge'])(
  'keeps SDK runtime detection when Bun is absent in %s',
  async (runtime) => {
    vi.stubEnv('NEXT_RUNTIME', runtime);
    const versions = { ...process.versions };
    delete versions.bun;
    vi.spyOn(process, 'versions', 'get').mockReturnValue(versions);
    const { register } = await import('@/instrumentation');
    register();
    expect(vi.mocked(Sentry.init).mock.calls[0][0]?.integrations).toEqual([]);
  },
);

it('does not read server process versions in the Edge runtime', async () => {
  vi.stubEnv('NEXT_RUNTIME', 'edge');
  vi.spyOn(process, 'versions', 'get').mockImplementation(() => {
    throw new Error('process.versions is unavailable in Edge');
  });
  const { register } = await import('@/instrumentation');
  expect(() => register()).not.toThrow();
  expect(vi.mocked(Sentry.init).mock.calls[0][0]?.integrations).toEqual([]);
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
