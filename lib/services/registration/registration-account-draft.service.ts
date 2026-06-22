import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

const REGISTRATION_ACCOUNT_DRAFT_COOKIE = "registration_account_draft";
const REGISTRATION_ACCOUNT_DRAFT_DURATION_MS = 30 * 60 * 1000;
const ACCOUNT_DRAFT_COOKIE_VERSION = "v1";
const AES_GCM_IV_BYTES = 12;

export interface RegistrationAccountDraft {
  cedula: string;
  email: string;
  password: string;
  issuedAt: number;
  expiresAt: number;
}

interface RegistrationAccountDraftInput {
  cedula: string;
  email: string;
  password: string;
}

function getRegistrationAccountDraftSecret() {
  const secret = process.env.REGISTRATION_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing REGISTRATION_SESSION_SECRET environment variable");
  }

  return createHash("sha256").update(secret).digest();
}

function encodeBase64Url(bytes: Buffer | Uint8Array | string) {
  return Buffer.from(bytes).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

function getCookieBaseOptions(): Pick<
  ResponseCookie,
  "httpOnly" | "maxAge" | "path" | "sameSite" | "secure"
> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: REGISTRATION_ACCOUNT_DRAFT_DURATION_MS / 1000,
    sameSite: "strict",
    path: "/",
  };
}

function isValidDraftPayload(
  payload: unknown,
): payload is RegistrationAccountDraft {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const draft = payload as Partial<RegistrationAccountDraft>;

  return (
    typeof draft.cedula === "string" &&
    typeof draft.email === "string" &&
    typeof draft.password === "string" &&
    typeof draft.issuedAt === "number" &&
    typeof draft.expiresAt === "number"
  );
}

export function serializeRegistrationAccountDraft(
  draft: RegistrationAccountDraft,
) {
  const iv = randomBytes(AES_GCM_IV_BYTES);
  const cipher = createCipheriv(
    "aes-256-gcm",
    getRegistrationAccountDraftSecret(),
    iv,
  );
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(draft), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ACCOUNT_DRAFT_COOKIE_VERSION,
    encodeBase64Url(iv),
    encodeBase64Url(ciphertext),
    encodeBase64Url(authTag),
  ].join(".");
}

export function parseRegistrationAccountDraftCookie(
  value: string,
): RegistrationAccountDraft | null {
  const [version, encodedIv, encodedCiphertext, encodedAuthTag] =
    value.split(".");

  if (
    version !== ACCOUNT_DRAFT_COOKIE_VERSION ||
    !encodedIv ||
    !encodedCiphertext ||
    !encodedAuthTag
  ) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getRegistrationAccountDraftSecret(),
      decodeBase64Url(encodedIv),
    );
    decipher.setAuthTag(decodeBase64Url(encodedAuthTag));

    const plaintext = Buffer.concat([
      decipher.update(decodeBase64Url(encodedCiphertext)),
      decipher.final(),
    ]);
    const payload = JSON.parse(plaintext.toString("utf8")) as unknown;

    if (!isValidDraftPayload(payload) || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createRegistrationAccountDraftCookie({
  cedula,
  email,
  password,
}: RegistrationAccountDraftInput): ResponseCookie {
  const issuedAt = Date.now();
  const draft: RegistrationAccountDraft = {
    cedula,
    email,
    password,
    issuedAt,
    expiresAt: issuedAt + REGISTRATION_ACCOUNT_DRAFT_DURATION_MS,
  };

  return {
    name: REGISTRATION_ACCOUNT_DRAFT_COOKIE,
    value: serializeRegistrationAccountDraft(draft),
    ...getCookieBaseOptions(),
  };
}

export function clearRegistrationAccountDraftCookie(): ResponseCookie {
  return {
    name: REGISTRATION_ACCOUNT_DRAFT_COOKIE,
    value: "",
    ...getCookieBaseOptions(),
    maxAge: 0,
  };
}

export async function getRegistrationAccountDraft(): Promise<RegistrationAccountDraft | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(REGISTRATION_ACCOUNT_DRAFT_COOKIE)?.value;

  if (!cookieValue) {
    return null;
  }

  return parseRegistrationAccountDraftCookie(cookieValue);
}
