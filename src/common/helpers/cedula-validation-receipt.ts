import {
  createSignedHash,
  parseSignedCookieValue,
  serializeSignedCookieValue,
} from './signed-cookie';

const CONTEXT = 'cedula-validation:v1';
const TTL_MS = 5 * 60 * 1000;

type Receipt = { subject: string; expiresAt: number };

export function issueCedulaValidationReceipt(cedula: string) {
  const expiresAt = Date.now() + TTL_MS;
  const receipt = serializeSignedCookieValue<Receipt>(
    { subject: createSignedHash(CONTEXT, cedula), expiresAt },
    CONTEXT,
  );
  return { receipt, expiresAt };
}

export function hasCedulaValidationReceipt(cedula: string, receipt: string) {
  const payload = parseSignedCookieValue<Receipt>(
    receipt,
    CONTEXT,
    (value): value is Receipt =>
      typeof value === 'object' &&
      value !== null &&
      'subject' in value &&
      typeof value.subject === 'string' &&
      'expiresAt' in value &&
      typeof value.expiresAt === 'number',
  );
  return Boolean(
    payload &&
    payload.expiresAt > Date.now() &&
    payload.subject === createSignedHash(CONTEXT, cedula),
  );
}
