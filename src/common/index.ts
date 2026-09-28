const ACCOUNT_URLS = {
  development: {
    login: 'https://cuenta.digital.gob.do/login',
    settings: 'https://cuenta.digital.gob.do/settings',
  },
  staging: {
    login: 'https://cuenta.digital.gob.do/login',
    settings: 'https://cuenta.digital.gob.do/settings',
  },
  production: {
    login: 'https://mi.cuentaunica.gob.do/login',
    settings: 'https://mi.cuentaunica.gob.do/settings',
  },
} as const;

type AppEnvironment = keyof typeof ACCOUNT_URLS;

const appEnvironment = process.env.NEXT_PUBLIC_APP_ENV ?? 'development';

if (!Object.prototype.hasOwnProperty.call(ACCOUNT_URLS, appEnvironment)) {
  throw new Error(
    `Invalid NEXT_PUBLIC_APP_ENV "${appEnvironment}". Expected development, staging, or production.`,
  );
}

const accountUrls = ACCOUNT_URLS[appEnvironment as AppEnvironment];

export const LOGIN_URL = accountUrls.login;
export const SETTINGS_URL = accountUrls.settings;

const DEFAULT_FIVE_MINUTES = 5 * 60;
export const LIVENESS_TIMEOUT_SECONDS = Number(
  process.env.NEXT_PUBLIC_LIVENESS_TIMEOUT_SECONDS || DEFAULT_FIVE_MINUTES,
);
