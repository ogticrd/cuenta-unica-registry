// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Envelope, Event } from '@sentry/core';

const fixture = fileURLToPath(
  new URL('./fixtures/sentry-runtime-probe.mjs', import.meta.url),
);

describe.each(['node', 'bun'])('native Sentry runtime: %s', (runtime) => {
  it('captures telemetry, protects automatic data, and rejects foreign tunnel DSNs', () => {
    const output = execFileSync(
      runtime === 'node' ? process.execPath : 'bun',
      [fixture],
      {
        encoding: 'utf8',
        timeout: 20_000,
        env: {
          PATH: process.env.PATH,
          NODE_ENV: 'test',
          NEXT_RUNTIME: 'nodejs',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const result: {
      version: string;
      integrations: string[];
      tunnelStatus: number;
      envelopes: Envelope[];
    } = JSON.parse(output);
    const items = result.envelopes.flatMap<Envelope[1][number]>(
      ([, entries]) => entries,
    );
    const events = items.filter(([header]) => header.type === 'event');
    expect(events).toHaveLength(1);
    expect((events[0][1] as Event).contexts?.runtime).toEqual({
      name: runtime,
      version: result.version,
    });
    expect(result.integrations).not.toContain('BunRuntimeContext');
    if (runtime === 'bun') {
      expect(result.integrations).toContain('BunHttpServer');
      expect(result.integrations).toContain('Fetch');
      expect(result.integrations).not.toContain('NodeFetch');
    }
    expect(items.map(([header]) => header.type)).toEqual(
      expect.arrayContaining(['span', 'log', 'trace_metric', 'feedback']),
    );
    const spans = items
      .filter(([header]) => header.type === 'span')
      .flatMap(([, payload]) => (payload as { items: unknown[] }).items);
    expect(spans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attributes: expect.objectContaining({
            'sentry.op': { type: 'string', value: 'http.client' },
          }),
        }),
      ]),
    );
    expect(output).not.toContain('synthetic-private-');
    expect(output).not.toContain('192.0.2.123');
    const feedback = items.filter(([header]) => header.type === 'feedback');
    expect(feedback).toHaveLength(1);
    expect(JSON.stringify(feedback)).toContain('00000000000');
    expect(JSON.stringify(feedback)).toContain('reporter@example.invalid');
    expect(JSON.stringify(feedback)).toContain('Synthetic reporter');
    expect(result.tunnelStatus).toBe(403);
  });
});
