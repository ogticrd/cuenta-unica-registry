import { createServer } from 'node:http';
import * as Sentry from '@sentry/nextjs';
import { sentryDataCollection } from '../../src/common/helpers/sentry-options.ts';

const requestOptions = {
  method: 'POST',
  headers: {
    cookie: 'session=synthetic-private-cookie',
    authorization: 'Bearer synthetic-private-token',
    'x-forwarded-for': '192.0.2.123',
  },
  body: 'synthetic-private-request',
};

const responseBody = 'synthetic-private-response';

// Run in a fresh runtime with the real SDK and an in-memory transport.
const envelopes = [];
const client = Sentry.init({
  dsn: 'https://public@example.test/1',
  tracesSampleRate: 1,
  dataCollection: sentryDataCollection,
  integrations: [Sentry.serveTunnelIntegration({ path: '/api/monitoring' })],
  transport: () => ({
    send: async (envelope) => {
      envelopes.push(envelope);
      return { statusCode: 200 };
    },
    flush: async () => true,
  }),
});
const server = createServer((_, response) => {
  response.end(responseBody);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const url = `http://127.0.0.1:${server.address().port}`;
  await Sentry.startSpan({ name: 'runtime-probe' }, async () => {
    const response = await fetch(url, requestOptions);
    await response.text();
    Sentry.logger.info('runtime-probe');
    Sentry.metrics.count('runtime.probe', 1);
    Sentry.captureException(new Error('runtime-probe'));
  });
  Sentry.captureFeedback({
    name: 'Synthetic reporter',
    email: 'reporter@example.invalid',
    message: 'Cédula: 00000000000\nSynthetic feedback',
  });
  // An envelope for an unapproved DSN must never be forwarded by the tunnel.
  const tunnel = await fetch(`${url}/api/monitoring`, {
    method: 'POST',
    body: JSON.stringify({ dsn: 'https://other@unapproved.invalid/2' }) + '\n',
  });
  await tunnel.text();
  await client.flush(2000);
  console.log(
    JSON.stringify({
      runtime: process.versions.bun ? 'bun' : 'node',
      version: process.versions.bun ?? process.version,
      integrations: client.getOptions().integrations.map(({ name }) => name),
      tunnelStatus: tunnel.status,
      envelopes,
    }),
  );
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await client.close(2000);
}
