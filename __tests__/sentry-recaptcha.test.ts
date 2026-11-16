import { afterEach, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { validateRecaptcha } from '@/actions/recaptcha.action';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  metrics: { count: vi.fn(), distribution: vi.fn() },
}));
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('retains CAPTCHA provider errors without sending the raw exception', async () => {
  vi.stubEnv('RECAPTCHA_BYPASS_LOCAL', 'false');
  vi.stubEnv('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'site-key');
  vi.stubEnv('RECAPTHA_PROJECT_ID', 'test-project');
  vi.stubEnv('RECAPTHA_API_KEY', 'private-api-key');
  const privateError = new Error(
    '00000000001 test@example.test https://provider.test?key=private-api-key',
  );
  privateError.name = 'test@example.test';
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(privateError));
  expect(await validateRecaptcha('private-token')).toEqual({
    message: 'errors.unknown',
  });
  expect(Sentry.captureException).not.toHaveBeenCalled();
  expect(Sentry.metrics.count).toHaveBeenCalledExactlyOnceWith(
    'registry.operation',
    1,
    { attributes: { operation: 'recaptcha', outcome: 'error' } },
  );
  expect(Sentry.captureMessage).toHaveBeenCalledWith(
    'recaptcha_verification_failed',
    {
      level: 'error',
      tags: { type: 'recaptcha' },
      extra: { errorName: 'UnknownError' },
    },
  );
});

it.each([
  [0.9, 'success'],
  [0.1, 'rejected'],
] as const)(
  'records CAPTCHA score %s as %s without collecting the score or token',
  async (score, outcome) => {
    vi.stubEnv('RECAPTCHA_BYPASS_LOCAL', 'false');
    vi.stubEnv('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'site-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ riskAnalysis: { score } })),
    );
    await validateRecaptcha('private-token');
    expect(Sentry.metrics.count).toHaveBeenCalledExactlyOnceWith(
      'registry.operation',
      1,
      { attributes: { operation: 'recaptcha', outcome } },
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(
      JSON.stringify(vi.mocked(Sentry.metrics.distribution).mock.calls),
    ).not.toContain('private-token');
  },
);
