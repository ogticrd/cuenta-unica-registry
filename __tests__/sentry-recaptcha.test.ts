import { afterEach, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { validateRecaptcha } from '@/actions/recaptcha.action';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
afterEach(() => {
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
  expect(Sentry.captureMessage).toHaveBeenCalledWith(
    'recaptcha_verification_failed',
    {
      level: 'error',
      tags: { type: 'recaptcha' },
      extra: { errorName: 'UnknownError' },
    },
  );
});
