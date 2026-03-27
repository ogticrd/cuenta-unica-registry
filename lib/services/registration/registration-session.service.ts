import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

import type {
  RegistrationSession,
  RegistrationSessionStatus,
} from "@/lib/types/registration/session";

const REGISTRATION_SESSION_COOKIE = "registration_session";
const REGISTRATION_SESSION_DURATION_MS = 30 * 60 * 1000;

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
    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as RegistrationSession;
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
    cedula,
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

  const session = parseSessionCookie(cookieValue);

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return session;
}
