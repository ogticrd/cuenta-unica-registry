import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

import type {
  RegistrationSession,
  RegistrationSessionStatus,
} from "@/lib/types/registration/session";
import { normalizeCedula } from "@/lib/utils/cedula";

const REGISTRATION_SESSION_COOKIE = "registration_session";
const REGISTRATION_SESSION_DURATION_MS = 30 * 60 * 1000;
const REGISTRATION_SESSION_CLOCK_SKEW_MS = 60 * 1000;
const REGISTRATION_SESSION_STATUSES = new Set<RegistrationSessionStatus>([
  "identified",
  "verified",
]);

function getRegistrationSessionSecret() {
  const secret = process.env.REGISTRATION_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing REGISTRATION_SESSION_SECRET environment variable");
  }

  return secret;
}

function signPayload(payload: string) {
  return createHmac("sha256", getRegistrationSessionSecret())
    .update(payload)
    .digest("base64url");
}

function serializeSession(session: RegistrationSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

function isValidSessionPayload(
  payload: unknown,
): payload is RegistrationSession {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const session = payload as Partial<RegistrationSession>;

  if (
    typeof session.cedula !== "string" ||
    normalizeCedula(session.cedula) !== session.cedula ||
    session.cedula.length !== 11
  ) {
    return false;
  }

  if (
    typeof session.status !== "string" ||
    !REGISTRATION_SESSION_STATUSES.has(
      session.status as RegistrationSessionStatus,
    )
  ) {
    return false;
  }

  if (
    session.returnUrl !== undefined &&
    typeof session.returnUrl !== "string"
  ) {
    return false;
  }

  const { issuedAt, expiresAt } = session;

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
    issuedAt <= now + REGISTRATION_SESSION_CLOCK_SKEW_MS &&
    expiresAt > now &&
    ttl > 0 &&
    ttl <= REGISTRATION_SESSION_DURATION_MS
  );
}

function parseSessionCookie(value: string): RegistrationSession | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload);
  const providedSignatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as unknown;

    return isValidSessionPayload(session) ? session : null;
  } catch {
    return null;
  }
}

function getCookieBaseOptions(): Pick<
  ResponseCookie,
  "httpOnly" | "maxAge" | "path" | "sameSite" | "secure"
> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: REGISTRATION_SESSION_DURATION_MS / 1000,
    sameSite: "strict",
    path: "/",
  };
}

export function createRegistrationSessionCookie(
  cedula: string,
  status: RegistrationSessionStatus = "identified",
  returnUrl?: string,
): ResponseCookie {
  const issuedAt = Date.now();
  const session: RegistrationSession = {
    cedula: normalizeCedula(cedula),
    status,
    ...(returnUrl ? { returnUrl } : {}),
    issuedAt,
    expiresAt: issuedAt + REGISTRATION_SESSION_DURATION_MS,
  };

  return {
    name: REGISTRATION_SESSION_COOKIE,
    value: serializeSession(session),
    ...getCookieBaseOptions(),
  };
}

export function clearRegistrationSessionCookie(): ResponseCookie {
  return {
    name: REGISTRATION_SESSION_COOKIE,
    value: "",
    ...getCookieBaseOptions(),
    maxAge: 0,
  };
}

export async function getRegistrationSession(): Promise<RegistrationSession | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(REGISTRATION_SESSION_COOKIE)?.value;

  if (!cookieValue) {
    return null;
  }

  return parseSessionCookie(cookieValue);
}
