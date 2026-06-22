import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

import { accountRequestSchema } from "@/lib/schemas/registration";
import type { RegistrationSession } from "@/lib/types/registration/session";
import { normalizeCedula } from "@/lib/utils/cedula";

const REGISTRATION_ACCOUNT_DRAFT_COOKIE = "registration_account_draft";
const REGISTRATION_ACCOUNT_DRAFT_DURATION_MS = 30 * 60 * 1000;
const REGISTRATION_ACCOUNT_DRAFT_CLOCK_SKEW_MS = 60 * 1000;
const ACCOUNT_DRAFT_COOKIE_VERSION = "v1";
const ACCOUNT_DRAFT_KEY_CONTEXT = "registration-account-draft-cookie:v1";
const ACCOUNT_DRAFT_AUTH_CONTEXT = Buffer.from(
  "registration_account_draft.v1",
  "utf8",
);
const AES_GCM_IV_BYTES = 12;

export interface RegistrationAccountDraft {
  sessionId: string;
  cedula: string;
  email: string;
  password: string;
  issuedAt: number;
  expiresAt: number;
}

interface RegistrationAccountDraftInput {
  sessionId: string;
  sessionExpiresAt: number;
  cedula: string;
  email: string;
  password: string;
}

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function getRegistrationAccountDraftSecret() {
  const secret = process.env.REGISTRATION_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing REGISTRATION_SESSION_SECRET environment variable");
  }

  return createHash("sha256")
    .update(ACCOUNT_DRAFT_KEY_CONTEXT)
    .update("\0")
    .update(secret)
    .digest();
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

function getDraftCookieOptionsForExpiresAt(expiresAt: number) {
  return {
    ...getCookieBaseOptions(),
    maxAge: Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
  };
}

function isValidDraftPayload(
  payload: unknown,
): payload is RegistrationAccountDraft {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const draft = payload as Partial<RegistrationAccountDraft>;

  if (
    typeof draft.sessionId !== "string" ||
    !UUID_V4_PATTERN.test(draft.sessionId)
  ) {
    return false;
  }

  if (
    typeof draft.cedula !== "string" ||
    normalizeCedula(draft.cedula) !== draft.cedula ||
    draft.cedula.length !== 11
  ) {
    return false;
  }

  if (
    !accountRequestSchema.safeParse({
      email: draft.email,
      password: draft.password,
    }).success
  ) {
    return false;
  }

  const { issuedAt, expiresAt } = draft;

  if (
    typeof issuedAt !== "number" ||
    typeof expiresAt !== "number" ||
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt)
  ) {
    return false;
  }

  const now = Date.now();
  const ttl = expiresAt - issuedAt;

  return (
    issuedAt > 0 &&
    issuedAt <= now + REGISTRATION_ACCOUNT_DRAFT_CLOCK_SKEW_MS &&
    expiresAt > now &&
    ttl > 0 &&
    ttl <= REGISTRATION_ACCOUNT_DRAFT_DURATION_MS
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
  cipher.setAAD(ACCOUNT_DRAFT_AUTH_CONTEXT);

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
  const parts = value.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const [version, encodedIv, encodedCiphertext, encodedAuthTag] = parts;

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
    decipher.setAAD(ACCOUNT_DRAFT_AUTH_CONTEXT);
    decipher.setAuthTag(decodeBase64Url(encodedAuthTag));

    const plaintext = Buffer.concat([
      decipher.update(decodeBase64Url(encodedCiphertext)),
      decipher.final(),
    ]);
    const payload = JSON.parse(plaintext.toString("utf8")) as unknown;

    if (!isValidDraftPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createRegistrationAccountDraftCookie({
  sessionId,
  sessionExpiresAt,
  cedula,
  email,
  password,
}: RegistrationAccountDraftInput): ResponseCookie {
  const issuedAt = Date.now();
  const expiresAt = Math.min(
    sessionExpiresAt,
    issuedAt + REGISTRATION_ACCOUNT_DRAFT_DURATION_MS,
  );
  const draft: RegistrationAccountDraft = {
    sessionId,
    cedula: normalizeCedula(cedula),
    email,
    password,
    issuedAt,
    expiresAt,
  };

  return {
    name: REGISTRATION_ACCOUNT_DRAFT_COOKIE,
    value: serializeRegistrationAccountDraft(draft),
    ...getDraftCookieOptionsForExpiresAt(expiresAt),
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

export function isRegistrationAccountDraftForSession(
  draft: RegistrationAccountDraft | null,
  session: Pick<RegistrationSession, "cedula" | "sessionId">,
): draft is RegistrationAccountDraft {
  return (
    !!draft &&
    draft.sessionId === session.sessionId &&
    normalizeCedula(draft.cedula) === normalizeCedula(session.cedula)
  );
}

export async function getRegistrationAccountDraft(): Promise<RegistrationAccountDraft | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(REGISTRATION_ACCOUNT_DRAFT_COOKIE)?.value;

  if (!cookieValue) {
    return null;
  }

  return parseRegistrationAccountDraftCookie(cookieValue);
}
