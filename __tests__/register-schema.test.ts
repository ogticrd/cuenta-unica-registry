import { createHash, webcrypto } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { zodResolver } from '@hookform/resolvers/zod';

import { createRegisterSchema } from '@/common/validation-schemas/register.schema';
import intl from '@/dictionaries/en.json';

// Synthetic credentials; the real HIBP client runs against a stubbed transport.
const password = 'Test-only!Sequoia-7824';
const values = {
  email: 'tester@example.invalid',
  emailConfirm: 'tester@example.invalid',
  password,
  passwordConfirm: password,
};
const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
const resolver = zodResolver(createRegisterSchema(intl, '00000000000'));
const options = { fields: {}, shouldUseNativeValidation: false };

afterEach(() => vi.unstubAllGlobals());

describe('registration password validation', () => {
  it.each([0, 42])('handles a HIBP breach count of %i', async (count) => {
    vi.stubGlobal('crypto', webcrypto);
    const fetch = vi.fn().mockResolvedValue(
      new Response(`${hash.slice(5)}:${count}\r\n`),
    );
    vi.stubGlobal('fetch', fetch);

    const result = await resolver(values, undefined, options);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toBe(
      `https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}?mode=sha1`,
    );
    if (count === 0) {
      expect(result.errors).toEqual({});
      expect(result.values).toEqual(values);
    } else {
      expect(result.errors.password?.message).toBe(intl.warnings.breachedPassword);
      expect(result.values).toEqual({});
    }
  });

  it('propagates a failed breach lookup instead of accepting the password', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const error = new Error('Breach lookup unavailable');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    await expect(resolver(values, undefined, options)).rejects.toBe(error);
  });
});
