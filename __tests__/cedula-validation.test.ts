import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateCedula } from '@/common/helpers/cedula-validation';
import { createCedulaSchema } from '@/common/validation-schemas';
import es from '@/dictionaries/es.json';
import * as validationActions from '@/actions/cedula-validation.action';
import { validateRecaptcha } from '@/actions/recaptcha.action';
import { hasCedulaValidationReceipt } from '@/common/helpers/cedula-validation-receipt';

vi.mock('@/actions/recaptcha.action', () => ({ validateRecaptcha: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_LUHN_EXCEPTION_HASHES', '');
  vi.mocked(validateRecaptcha).mockResolvedValue({ isHuman: true });
  vi.stubEnv('CEDULA_VALIDATION_API', '');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('cedula validation', () => {
  it('rejects a checksum failure locally when no exception lookup is supplied', async () => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await createCedulaSchema(es).safeParseAsync({
      cedula: '00000000001',
      token: '',
    });

    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts a cedula with a valid Luhn checksum', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(validateCedula('00000000000')).resolves.toBe('valid');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports unavailable when the fallback is not configured', async () => {
    await expect(validateCedula('00000000001')).resolves.toBe('unavailable');
  });

  it('accepts a configured Luhn exception hash', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv(
      'NEXT_PUBLIC_LUHN_EXCEPTION_HASHES',
      '031f50e5e09a5f61b2da02c2f59fde68fba579de4e1ef7a5490d6425f810977e',
    );

    await expect(validateCedula('00000000001')).resolves.toBe('valid');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts a Luhn exception validated by the Citizens API', async () => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ valid: true })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(validateCedula('00000000001')).resolves.toBe('valid');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe(
      'https://api.example.test/v3/cedulas/00000000001/validate',
    );
    expect(options).toMatchObject({ cache: 'no-store' });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects a cedula rejected by the Citizens API', async () => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ valid: false }), {
          status: 200,
        }),
      ),
    );

    await expect(validateCedula('00000000001')).resolves.toBe('invalid');
  });

  it.each([
    {
      name: 'a timeout',
      response: () =>
        Promise.reject(new DOMException('Timed out', 'TimeoutError')),
    },
    {
      name: 'a missing valid field',
      response: () => Promise.resolve(Response.json({})),
    },
    {
      name: 'a non-boolean valid field',
      response: () => Promise.resolve(Response.json({ valid: 'false' })),
    },
    {
      name: 'an HTTP error',
      response: () =>
        Promise.resolve(
          new Response(JSON.stringify({ message: 'Unavailable' }), {
            status: 503,
          }),
        ),
    },
    {
      name: 'a malformed response',
      response: () => Promise.resolve(new Response('not-json')),
    },
    {
      name: 'a network error',
      response: () => Promise.reject(new Error('Network unavailable')),
    },
  ])('reports unavailable when the API returns $name', async ({ response }) => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(response));

    await expect(validateCedula('00000000001')).resolves.toBe('unavailable');
  });

  it('reports a malformed API URL as unavailable', async () => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'not-a-url');
    await expect(validateCedula('00000000001')).resolves.toBe('unavailable');
  });

  it.each(['', '123', 'abcdefghijk'])(
    'rejects malformed input %s without a lookup',
    async (cedula) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      await expect(validateCedula(cedula)).resolves.toBe('invalid');
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

describe('public exception validation action', () => {
  beforeEach(() => {
    vi.stubEnv('SITE_COOKIE_KEY', 'receipt-test-secret');
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
  });

  it('only exports the CAPTCHA-guarded entry point', () => {
    expect(Object.keys(validationActions)).toEqual(['checkCedulaException']);
  });

  it.each(['missing', 'rejected'] as const)(
    'rejects a %s CAPTCHA before any metered lookup',
    async (scenario) => {
      vi.mocked(validateRecaptcha).mockResolvedValue({ isHuman: false });
      const lookup = vi.fn();
      vi.stubGlobal('fetch', lookup);
      expect(
        await validationActions.checkCedulaException(
          '00000000001',
          scenario === 'missing' ? '' : 'private-token',
        ),
      ).toEqual({ status: 'recaptcha' });
      expect(lookup).not.toHaveBeenCalled();
      expect(validateRecaptcha).toHaveBeenCalledTimes(
        scenario === 'missing' ? 0 : 1,
      );
    },
  );

  it('issues a receipt only after a guarded successful lookup', async () => {
    const lookup = vi.fn().mockResolvedValue(Response.json({ valid: true }));
    vi.stubGlobal('fetch', lookup);
    const result = await validationActions.checkCedulaException(
      '00000000001',
      'private-token',
    );
    expect(validateRecaptcha).toHaveBeenCalledWith('private-token');
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('valid');
    expect(
      'receipt' in result &&
        hasCedulaValidationReceipt('00000000001', result.receipt),
    ).toBe(true);
  });

});

// Proofs are signed server-side so a browser cannot manufacture a whitelist pass.
describe('exception validation receipts', () => {
  beforeEach(() => {
    vi.stubEnv('SITE_COOKIE_KEY', 'receipt-test-secret');
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
  });

  it('reuses a signed result without another metered lookup', async () => {
    const { issueCedulaValidationReceipt } =
      await import('@/common/helpers/cedula-validation-receipt');
    const { receipt } = issueCedulaValidationReceipt('00000000001');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(validateCedula('00000000001', receipt)).resolves.toBe('valid');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['different ID', 'tampered signature', 'expired proof'])(
    'does not trust a %s',
    async (scenario) => {
      const { issueCedulaValidationReceipt } =
        await import('@/common/helpers/cedula-validation-receipt');
      const original = issueCedulaValidationReceipt('00000000001');
      const receipt =
        scenario === 'tampered signature'
          ? `${original.receipt}x`
          : original.receipt;
      const id = scenario === 'different ID' ? '00000000002' : '00000000001';
      const now = vi.spyOn(Date, 'now');
      if (scenario === 'expired proof') now.mockReturnValue(original.expiresAt);
      const fetchMock = vi
        .fn()
        .mockResolvedValue(Response.json({ valid: false }));
      vi.stubGlobal('fetch', fetchMock);
      try {
        await expect(validateCedula(id, receipt)).resolves.toBe('invalid');
        expect(fetchMock).toHaveBeenCalledTimes(1);
      } finally {
        now.mockRestore();
      }
    },
  );
});
