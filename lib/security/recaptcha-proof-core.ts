export const RECAPTCHA_PROOF_COOKIE = "recaptcha_proof";
export const RECOVERY_RECAPTCHA_ACTION = "recovery_submit";

const RECAPTCHA_PROOF_TTL_MS = 2 * 60 * 1000;

interface RecaptchaProof {
  action: string;
  issuedAt: number;
  expiresAt: number;
}

function toBase64Url(value: Uint8Array) {
  let binary = "";

  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getSigningKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signPayload(payload: string, secret: string) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(secret),
    new TextEncoder().encode(payload),
  );

  return toBase64Url(new Uint8Array(signature));
}

function timingSafeEquals(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

export async function serializeRecaptchaProof(
  action: string,
  secret: string,
  now = Date.now(),
) {
  const proof: RecaptchaProof = {
    action,
    issuedAt: now,
    expiresAt: now + RECAPTCHA_PROOF_TTL_MS,
  };
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(proof)));

  return `${payload}.${await signPayload(payload, secret)}`;
}

export async function validateRecaptchaProof(
  value: string | undefined,
  action: string,
  secret: string,
  now = Date.now(),
) {
  if (!value) {
    return false;
  }

  const parts = value.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payload, signature] = parts;
  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = await signPayload(payload, secret);
  if (!timingSafeEquals(signature, expectedSignature)) {
    return false;
  }

  try {
    const proof = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as Partial<RecaptchaProof>;

    return (
      proof.action === action &&
      typeof proof.issuedAt === "number" &&
      proof.issuedAt <= now &&
      typeof proof.expiresAt === "number" &&
      proof.expiresAt > now &&
      proof.expiresAt - proof.issuedAt === RECAPTCHA_PROOF_TTL_MS
    );
  } catch {
    return false;
  }
}
