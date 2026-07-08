import { createHash, createHmac, timingSafeEqual } from 'crypto';

function getSiteCookieSecret(context: string) {
  const secret = process.env.SITE_COOKIE_KEY;

  if (!secret) {
    throw new Error('Missing SITE_COOKIE_KEY environment variable');
  }

  return createHash('sha256').update(context).update('\0').update(secret).digest();
}

function signPayload(payload: string, context: string) {
  return createHmac('sha256', getSiteCookieSecret(context))
    .update(payload)
    .digest('base64url');
}

export function serializeSignedCookieValue<T>(payload: T, context: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  );
  const signature = signPayload(encodedPayload, context);

  return `${encodedPayload}.${signature}`;
}

export function parseSignedCookieValue<T>(
  value: string,
  context: string,
  isValidPayload: (payload: unknown) => payload is T,
): T | null {
  const parts = value.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload, context);
  const providedSignatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8'),
    ) as unknown;

    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createSignedHash(context: string, ...values: string[]) {
  const secret = getSiteCookieSecret(context);
  const hmac = createHmac('sha256', secret);

  for (const value of values) {
    hmac.update(value);
    hmac.update('\0');
  }

  return hmac.digest('base64url');
}
