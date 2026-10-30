import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateCedula } from '@/actions/cedula-validation.action';
import { createCedulaSchema } from '@/common/validation-schemas';
import es from '@/dictionaries/es.json';

beforeEach(() => {
  vi.stubEnv('CEDULA_VALIDATION_API', '');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('cedula validation', () => {
  it('accepts a cedula with a valid Luhn checksum', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await createCedulaSchema(es).safeParseAsync({
      cedula: '00000000000',
      token: '',
    });

    expect(result.success).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a cedula with an invalid Luhn checksum', async () => {
    const result = await createCedulaSchema(es).safeParseAsync({
      cedula: '00000000001',
      token: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['cedula'],
            message: es.errors.cedula.invalid,
          }),
        ]),
      );
    }
  });

  it('accepts a configured Luhn exception hash', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv(
      'NEXT_PUBLIC_LUHN_EXCEPTION_HASHES',
      '031f50e5e09a5f61b2da02c2f59fde68fba579de4e1ef7a5490d6425f810977e',
    );

    const result = await createCedulaSchema(es).safeParseAsync({
      cedula: '00000000001',
      token: '',
    });

    expect(result.success).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts a Luhn exception validated by the Citizens API', async () => {
    vi.stubEnv(
      'CEDULA_VALIDATION_API',
      'https://api.example.test/v3/cedulas',
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ valid: true })));
    vi.stubGlobal('fetch', fetchMock);

    const result = await createCedulaSchema(es).safeParseAsync({
      cedula: '00000000001',
      token: '',
    });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe(
      'https://api.example.test/v3/cedulas/00000000001/validate',
    );
    expect(options).toMatchObject({ cache: 'no-store' });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects a cedula rejected by the Citizens API', async () => {
    vi.stubEnv(
      'CEDULA_VALIDATION_API',
      'https://api.example.test/v3/cedulas',
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ valid: false }), {
          status: 200,
        }),
      ),
    );

    await expect(validateCedula('00000000001')).resolves.toBe(false);
  });

  it.each([
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
  ])('rejects safely when the API returns $name', async ({ response }) => {
    vi.stubEnv(
      'CEDULA_VALIDATION_API',
      'https://api.example.test/v3/cedulas',
    );
    vi.stubGlobal('fetch', vi.fn().mockImplementation(response));

    await expect(validateCedula('00000000001')).resolves.toBe(false);
  });
});
