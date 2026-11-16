import { expect, it, vi } from 'vitest';
import {
  BrowserClient,
  defaultStackParser,
  getCurrentScope,
  getIsolationScope,
} from '@sentry/browser';
import { NodeClient } from '@sentry/node';
import type { Envelope } from '@sentry/core';
import { recordRoutineEvent } from '@/common/helpers/sentry-telemetry';

// Exercise the installed SDK, bypassing the suite's normal Sentry stub.
vi.mock('@sentry/nextjs', async () => import('@sentry/browser'));

it.each([
  ['browser', BrowserClient],
  ['server', NodeClient],
] as const)(
  'sends a standalone %s log with tracing disabled and no error event',
  async (_, Client) => {
    const envelopes: Envelope[] = [];
    const client = new Client({
      dsn: 'https://public@example.test/1',
      enableLogs: true,
      enabled: true,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      integrations: [],
      stackParser: defaultStackParser,
      transport: () => ({
        send: async (envelope) => {
          envelopes.push(envelope);
          return { statusCode: 200 };
        },
        flush: async () => true,
      }),
    });
    const scope = getCurrentScope();
    const previousClient = scope.getClient();
    scope.setClient(client);
    client.init();

    try {
      recordRoutineEvent({
        category: 'biometric',
        message: 'biometric_face_match_passed',
        level: 'info',
        data: { source: 'registration' },
      });
      expect(await client.flush(2000)).toBe(true);
      const items = envelopes.flatMap<Envelope[1][number]>(
        ([, envelopeItems]) => envelopeItems,
      );
      expect(items.map(([header]) => header.type)).toEqual(['log']);
      expect(items[0][1]).toMatchObject({
        items: [
          {
            body: 'biometric_face_match_passed',
            level: 'info',
            trace_id: expect.any(String),
            attributes: {
              category: { type: 'string', value: 'biometric' },
              source: { type: 'string', value: 'registration' },
            },
          },
        ],
      });
      expect(getIsolationScope().getScopeData().breadcrumbs).toEqual([
        expect.objectContaining({ message: 'biometric_face_match_passed' }),
      ]);
    } finally {
      await client.close(2000);
      scope.clear();
      getIsolationScope().clear();
      scope.setClient(previousClient);
    }
  },
);
