export const SETTINGS_URL = 'https://mi.cuentaunica.gob.do/ui/settings';
export const LOGIN_URL = 'https://mi.cuentaunica.gob.do/ui/login';

const DEFAULT_FIVE_MINUTES = 5 * 60;
export const LIVENESS_TIMEOUT_SECONDS = Number(
  process.env.NEXT_PUBLIC_LIVENESS_TIMEOUT_SECONDS || DEFAULT_FIVE_MINUTES,
);
