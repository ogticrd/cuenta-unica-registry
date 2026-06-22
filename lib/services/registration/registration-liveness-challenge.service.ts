import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

import type { RegistrationSession } from "@/lib/types/registration/session";

const REGISTRATION_LIVENESS_CHALLENGE_COOKIE =
  "registration_liveness_challenge";
const REGISTRATION_LIVENESS_CHALLENGE_DURATION_MS = 10 * 60 * 1000;
const REGISTRATION_LIVENESS_CHALLENGE_CLOCK_SKEW_MS = 60 * 1000;
const REGISTRATION_LIVENESS_CHALLENGE_KEY_CONTEXT =
  "registration-liveness-challenge-cookie:v1";
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

interface RegistrationLivenessChallenge {
  registrationSessionId: string;
  livenessSessionId: string;
  issuedAt: number;
  expiresAt: number;
}

function getRegistrationLivenessChallengeSecret() {
  const secret = process.env.REGISTRATION_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing REGISTRATION_SESSION_SECRET environment variable");
  }

  return createHash("sha256")
    .update(REGISTRATION_LIVENESS_CHALLENGE_KEY_CONTEXT)
    .update("\0")
    .update(secret)
    .digest();
}

function signPayload(payload: string) {
  return createHmac("sha256", getRegistrationLivenessChallengeSecret())
    .update(payload)
    .digest("base64url");
}

function serializeChallenge(challenge: RegistrationLivenessChallenge) {
  const payload = Buffer.from(JSON.stringify(challenge)).toString("base64url");
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

function isValidChallengePayload(
  payload: unknown,
): payload is RegistrationLivenessChallenge {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const challenge = payload as Partial<RegistrationLivenessChallenge>;

  if (
    typeof challenge.registrationSessionId !== "string" ||
    !UUID_V4_PATTERN.test(challenge.registrationSessionId)
  ) {
    return false;
  }

  if (
    typeof challenge.livenessSessionId !== "string" ||
    challenge.livenessSessionId.length === 0 ||
    challenge.livenessSessionId.length > 256
  ) {
    return false;
  }

  const { issuedAt, expiresAt } = challenge;

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
    issuedAt <= now + REGISTRATION_LIVENESS_CHALLENGE_CLOCK_SKEW_MS &&
    expiresAt > now &&
    ttl > 0 &&
    ttl <= REGISTRATION_LIVENESS_CHALLENGE_DURATION_MS
  );
}

function parseRegistrationLivenessChallengeCookie(
  value: string,
): RegistrationLivenessChallenge | null {
  const parts = value.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;

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
    const challenge = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as unknown;

    return isValidChallengePayload(challenge) ? challenge : null;
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
    maxAge: REGISTRATION_LIVENESS_CHALLENGE_DURATION_MS / 1000,
    sameSite: "strict",
    path: "/",
  };
}

function getChallengeCookieOptionsForExpiresAt(expiresAt: number) {
  return {
    ...getCookieBaseOptions(),
    maxAge: Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
  };
}

export function createRegistrationLivenessChallengeCookie(
  registrationSession: RegistrationSession,
  livenessSessionId: string,
): ResponseCookie {
  const issuedAt = Date.now();
  const expiresAt = Math.min(
    registrationSession.expiresAt,
    issuedAt + REGISTRATION_LIVENESS_CHALLENGE_DURATION_MS,
  );
  const challenge: RegistrationLivenessChallenge = {
    registrationSessionId: registrationSession.sessionId,
    livenessSessionId,
    issuedAt,
    expiresAt,
  };

  return {
    name: REGISTRATION_LIVENESS_CHALLENGE_COOKIE,
    value: serializeChallenge(challenge),
    ...getChallengeCookieOptionsForExpiresAt(expiresAt),
  };
}

export function clearRegistrationLivenessChallengeCookie(): ResponseCookie {
  return {
    name: REGISTRATION_LIVENESS_CHALLENGE_COOKIE,
    value: "",
    ...getCookieBaseOptions(),
    maxAge: 0,
  };
}

export async function getRegistrationLivenessChallenge(): Promise<RegistrationLivenessChallenge | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(
    REGISTRATION_LIVENESS_CHALLENGE_COOKIE,
  )?.value;

  if (!cookieValue) {
    return null;
  }

  return parseRegistrationLivenessChallengeCookie(cookieValue);
}
