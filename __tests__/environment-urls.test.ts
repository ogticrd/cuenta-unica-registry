import { afterEach, describe, expect, it, vi } from 'vitest';

describe('environment URLs', () => {
  const originalAppEnvironment = process.env.NEXT_PUBLIC_APP_ENV;

  afterEach(() => {
    if (originalAppEnvironment === undefined) {
      delete process.env.NEXT_PUBLIC_APP_ENV;
    } else {
      process.env.NEXT_PUBLIC_APP_ENV = originalAppEnvironment;
    }

    vi.resetModules();
  });

  async function loadUrls(environment?: string) {
    if (environment === undefined) {
      delete process.env.NEXT_PUBLIC_APP_ENV;
    } else {
      process.env.NEXT_PUBLIC_APP_ENV = environment;
    }

    vi.resetModules();

    return import('@/common');
  }

  it.each(['development', 'staging'])(
    'uses Cuenta Digital URLs in %s',
    async (environment) => {
      const { LOGIN_URL, SETTINGS_URL } = await loadUrls(environment);

      expect(LOGIN_URL).toBe('https://cuenta.digital.gob.do/login');
      expect(SETTINGS_URL).toBe('https://cuenta.digital.gob.do/settings');
    },
  );

  it('uses Cuenta Unica URLs in production', async () => {
    const { LOGIN_URL, SETTINGS_URL } = await loadUrls('production');

    expect(LOGIN_URL).toBe('https://mi.cuentaunica.gob.do/login');
    expect(SETTINGS_URL).toBe('https://mi.cuentaunica.gob.do/settings');
  });

  it('defaults to development URLs when the environment is undefined', async () => {
    const { LOGIN_URL, SETTINGS_URL } = await loadUrls();

    expect(LOGIN_URL).toBe('https://cuenta.digital.gob.do/login');
    expect(SETTINGS_URL).toBe('https://cuenta.digital.gob.do/settings');
  });

  it('rejects an unknown environment', async () => {
    await expect(loadUrls('qa')).rejects.toThrow(
      'Invalid NEXT_PUBLIC_APP_ENV "qa". Expected development, staging, or production.',
    );
  });
});
