import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import {
  filterRegistryMetric,
  measureRegistryOperation,
  responseOutcome,
} from '@/common/helpers/sentry-metrics';

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  metrics: { count: vi.fn(), distribution: vi.fn() },
}));

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

it.each([
  [200, 'success'],
  [403, 'rejected'],
  [429, 'limited'],
  [502, 'error'],
] as const)(
  'records exactly one count and duration for HTTP %s',
  async (status, outcome) => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(42);
    const result = { status, cedula: '00000000001', token: 'private-token' };
    const run = vi.fn().mockResolvedValue(result);
    expect(
      await measureRegistryOperation('biometric.verify', run, responseOutcome),
    ).toBe(result);
    expect(run).toHaveBeenCalledTimes(1);
    const attributes = { operation: 'biometric.verify', outcome };
    expect(Sentry.metrics.count).toHaveBeenCalledExactlyOnceWith(
      'registry.operation',
      1,
      { attributes },
    );
    expect(Sentry.metrics.distribution).toHaveBeenCalledExactlyOnceWith(
      'registry.operation.duration',
      32,
      { unit: 'millisecond', attributes },
    );
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(2);
    const telemetry = JSON.stringify([
      vi.mocked(Sentry.metrics.count).mock.calls,
      vi.mocked(Sentry.metrics.distribution).mock.calls,
      vi.mocked(Sentry.addBreadcrumb).mock.calls,
    ]);
    expect(telemetry).not.toContain(result.cedula);
    expect(telemetry).not.toContain(result.token);
  },
);

it('emits no completion metrics until the operation settles', async () => {
  let complete!: (value: { status: number }) => void;
  const pending = new Promise<{ status: number }>((resolve) => {
    complete = resolve;
  });
  const measured = measureRegistryOperation(
    'biometric.session',
    () => pending,
    responseOutcome,
  );
  expect(Sentry.metrics.count).not.toHaveBeenCalled();
  complete({ status: 200 });
  await measured;
  expect(Sentry.metrics.count).toHaveBeenCalledTimes(1);
});

it('preserves a thrown application error and records an error outcome', async () => {
  const error = new Error('private-token');
  await expect(
    measureRegistryOperation(
      'recaptcha',
      async () => {
        throw error;
      },
      () => 'success',
    ),
  ).rejects.toBe(error);
  expect(Sentry.metrics.count).toHaveBeenCalledExactlyOnceWith(
    'registry.operation',
    1,
    { attributes: { operation: 'recaptcha', outcome: 'error' } },
  );
  expect(
    JSON.stringify(vi.mocked(Sentry.addBreadcrumb).mock.calls),
  ).not.toContain('private-token');
});

it('telemetry failures cannot change business results or exceptions', async () => {
  vi.mocked(Sentry.addBreadcrumb).mockImplementation(() => {
    throw new Error('SDK unavailable');
  });
  vi.mocked(Sentry.metrics.count).mockImplementation(() => {
    throw new Error('SDK unavailable');
  });
  const result = { status: 200 };
  expect(
    await measureRegistryOperation(
      'biometric.session',
      async () => result,
      responseOutcome,
    ),
  ).toBe(result);
  const failure = new Error('provider failure');
  await expect(
    measureRegistryOperation(
      'recaptcha',
      async () => {
        throw failure;
      },
      () => 'success',
    ),
  ).rejects.toBe(failure);
});

it('a failing outcome classifier cannot replace a successful result', async () => {
  const result = { status: 200 };
  expect(
    await measureRegistryOperation(
      'biometric.session',
      async () => result,
      () => {
        throw new Error('classifier failed');
      },
    ),
  ).toBe(result);
});

it('strips unknown attributes and SDK-enriched user data', () => {
  const filtered = filterRegistryMetric({
    name: 'registry.operation',
    type: 'counter',
    value: 1,
    attributes: {
      operation: 'recaptcha',
      outcome: 'success',
      cedula: '00000000001',
      'user.email': 'test@example.test',
      'sentry.release': 'v1.5.19',
    },
  });
  expect(filtered?.attributes).toEqual({
    operation: 'recaptcha',
    outcome: 'success',
    'sentry.release': 'v1.5.19',
  });
});

it.each([
  { name: '00000000001', operation: 'recaptcha', outcome: 'success' },
  {
    name: 'registry.operation',
    operation: 'test@example.test',
    outcome: 'success',
  },
  {
    name: 'registry.operation',
    operation: 'recaptcha',
    outcome: 'private-token',
  },
])(
  'drops unknown metric names or dimensions: %j',
  ({ name, ...attributes }) => {
    expect(
      filterRegistryMetric({ name, type: 'counter', value: 1, attributes }),
    ).toBeNull();
  },
);
