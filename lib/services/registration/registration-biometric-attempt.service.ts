import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

import type { RegistrationSession } from "@/lib/types/registration/session";
import { normalizeCedula } from "@/lib/utils/cedula";

const REGISTRATION_BIOMETRIC_STATE_COOKIE = "registration_biometric_state";
const REGISTRATION_BIOMETRIC_STATE_VERSION = 1;
const BIOMETRIC_STATE_CONTEXT = "registration-biometric-state-cookie:v1";
const BIOMETRIC_SUBJECT_CONTEXT = "registration-biometric-subject:v1";
const BIOMETRIC_CLIENT_TOKEN_CONTEXT =
  "registration-biometric-client-request-token:v1";
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_COOLDOWN_SECONDS = 15 * 60;
const DEFAULT_STATE_TTL_SECONDS = 30 * 60;
const LIVENESS_SESSION_TTL_SECONDS = 3 * 60;

interface RegistrationBiometricActiveChallenge {
  registrationSessionId: string;
  sessionId: string;
  clientRequestToken: string;
  attemptNumber: number;
  issuedAt: number;
  expiresAt: number;
}

export interface RegistrationBiometricState {
  version: typeof REGISTRATION_BIOMETRIC_STATE_VERSION;
  subjectHash: string;
  attemptsCreated: number;
  cooldownUntil?: number;
  activeChallenge?: RegistrationBiometricActiveChallenge;
  issuedAt: number;
  updatedAt: number;
  expiresAt: number;
}

export type PrepareRegistrationBiometricAttemptResult =
  | {
      status: "blocked";
      state: RegistrationBiometricState;
      code: "biometric_attempt_limit_exceeded" | "biometric_cooldown_active";
      retryAfterSeconds: number;
    }
  | {
      status: "reuse";
      state: RegistrationBiometricState;
      sessionId: string;
    }
  | {
      status: "create";
      state: RegistrationBiometricState;
      attemptNumber: number;
      clientRequestToken: string;
    };

export function getRegistrationBiometricConfig() {
  return {
    maxAttempts:
      Number(process.env.BIOMETRIC_MAX_ATTEMPTS) || DEFAULT_MAX_ATTEMPTS,
    cooldownSeconds:
      Number(process.env.BIOMETRIC_COOLDOWN_SECONDS) ||
      DEFAULT_COOLDOWN_SECONDS,
    stateTtlSeconds:
      Number(process.env.BIOMETRIC_STATE_TTL_SECONDS) ||
      DEFAULT_STATE_TTL_SECONDS,
  };
}

function getSigningKey(context: string) {
  const secret = process.env.REGISTRATION_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing REGISTRATION_SESSION_SECRET environment variable");
  }

  return createHash("sha256")
    .update(context)
    .update("\0")
    .update(secret)
    .digest();
}

function createSignedHash(context: string, ...values: string[]) {
  const hmac = createHmac("sha256", getSigningKey(context));

  for (const value of values) {
    hmac.update(value);
    hmac.update("\0");
  }

  return hmac.digest("base64url");
}

function getSubjectHash(registrationSession: RegistrationSession) {
  return createSignedHash(
    BIOMETRIC_SUBJECT_CONTEXT,
    normalizeCedula(registrationSession.cedula),
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getSigningKey(BIOMETRIC_STATE_CONTEXT))
    .update(payload)
    .digest("base64url");
}

function serializeState(state: RegistrationBiometricState) {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function isFiniteTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isActiveChallenge(
  value: unknown,
): value is RegistrationBiometricActiveChallenge {
  if (!value || typeof value !== "object") {
    return false;
  }

  const challenge = value as Partial<RegistrationBiometricActiveChallenge>;

  return (
    typeof challenge.registrationSessionId === "string" &&
    challenge.registrationSessionId.length > 0 &&
    typeof challenge.sessionId === "string" &&
    challenge.sessionId.length > 0 &&
    challenge.sessionId.length <= 256 &&
    typeof challenge.clientRequestToken === "string" &&
    /^[A-Za-z0-9_-]{1,64}$/.test(challenge.clientRequestToken) &&
    typeof challenge.attemptNumber === "number" &&
    Number.isInteger(challenge.attemptNumber) &&
    challenge.attemptNumber > 0 &&
    isFiniteTimestamp(challenge.issuedAt) &&
    isFiniteTimestamp(challenge.expiresAt)
  );
}

function isRegistrationBiometricState(
  value: unknown,
): value is RegistrationBiometricState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<RegistrationBiometricState>;

  return (
    state.version === REGISTRATION_BIOMETRIC_STATE_VERSION &&
    typeof state.subjectHash === "string" &&
    state.subjectHash.length > 0 &&
    typeof state.attemptsCreated === "number" &&
    Number.isInteger(state.attemptsCreated) &&
    state.attemptsCreated >= 0 &&
    (state.cooldownUntil === undefined ||
      isFiniteTimestamp(state.cooldownUntil)) &&
    (state.activeChallenge === undefined ||
      isActiveChallenge(state.activeChallenge)) &&
    isFiniteTimestamp(state.issuedAt) &&
    isFiniteTimestamp(state.updatedAt) &&
    isFiniteTimestamp(state.expiresAt) &&
    state.expiresAt > Date.now()
  );
}

function parseState(value: string): RegistrationBiometricState | null {
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
    const state = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as unknown;

    return isRegistrationBiometricState(state) ? state : null;
  } catch {
    return null;
  }
}

function createEmptyState(
  registrationSession: RegistrationSession,
  now: number,
): RegistrationBiometricState {
  return {
    version: REGISTRATION_BIOMETRIC_STATE_VERSION,
    subjectHash: getSubjectHash(registrationSession),
    attemptsCreated: 0,
    issuedAt: now,
    updatedAt: now,
    expiresAt: now + getRegistrationBiometricConfig().stateTtlSeconds * 1000,
  };
}

function normalizeState(
  state: RegistrationBiometricState | null,
  registrationSession: RegistrationSession,
  now: number,
) {
  const subjectHash = getSubjectHash(registrationSession);

  if (!state || state.subjectHash !== subjectHash || state.expiresAt <= now) {
    return createEmptyState(registrationSession, now);
  }

  if (state.cooldownUntil && state.cooldownUntil <= now) {
    return createEmptyState(registrationSession, now);
  }

  const activeChallenge =
    state.activeChallenge &&
    state.activeChallenge.expiresAt > now &&
    state.activeChallenge.registrationSessionId ===
      registrationSession.sessionId
      ? state.activeChallenge
      : undefined;

  return { ...state, activeChallenge };
}

export async function getRegistrationBiometricState() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(
    REGISTRATION_BIOMETRIC_STATE_COOKIE,
  )?.value;

  return cookieValue ? parseState(cookieValue) : null;
}

function getCookieBaseOptions(): Pick<
  ResponseCookie,
  "httpOnly" | "maxAge" | "path" | "sameSite" | "secure"
> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: getRegistrationBiometricConfig().stateTtlSeconds,
    sameSite: "strict",
    path: "/",
  };
}

export function createRegistrationBiometricStateCookie(
  state: RegistrationBiometricState,
): ResponseCookie {
  return {
    name: REGISTRATION_BIOMETRIC_STATE_COOKIE,
    value: serializeState(state),
    ...getCookieBaseOptions(),
    maxAge: Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 1000)),
  };
}

export function prepareRegistrationBiometricAttempt({
  state,
  registrationSession,
  forceNew,
  now = Date.now(),
}: {
  state: RegistrationBiometricState | null;
  registrationSession: RegistrationSession;
  forceNew: boolean;
  now?: number;
}): PrepareRegistrationBiometricAttemptResult {
  const config = getRegistrationBiometricConfig();
  const normalizedState = normalizeState(state, registrationSession, now);

  if (normalizedState.cooldownUntil && normalizedState.cooldownUntil > now) {
    return {
      status: "blocked",
      state: normalizedState,
      code: "biometric_cooldown_active",
      retryAfterSeconds: Math.ceil(
        (normalizedState.cooldownUntil - now) / 1000,
      ),
    };
  }

  if (!forceNew && normalizedState.activeChallenge) {
    return {
      status: "reuse",
      state: normalizedState,
      sessionId: normalizedState.activeChallenge.sessionId,
    };
  }

  if (normalizedState.attemptsCreated >= config.maxAttempts) {
    const cooldownUntil = now + config.cooldownSeconds * 1000;
    const blockedState: RegistrationBiometricState = {
      ...normalizedState,
      activeChallenge: undefined,
      cooldownUntil,
      updatedAt: now,
    };

    return {
      status: "blocked",
      state: blockedState,
      code: "biometric_attempt_limit_exceeded",
      retryAfterSeconds: config.cooldownSeconds,
    };
  }

  const attemptNumber = normalizedState.attemptsCreated + 1;
  const clientRequestToken = createSignedHash(
    BIOMETRIC_CLIENT_TOKEN_CONTEXT,
    normalizedState.subjectHash,
    registrationSession.sessionId,
    String(normalizedState.issuedAt),
    String(attemptNumber),
  ).slice(0, 64);

  return {
    status: "create",
    state: normalizedState,
    attemptNumber,
    clientRequestToken,
  };
}

export function recordRegistrationBiometricSessionCreated({
  state,
  registrationSessionId,
  sessionId,
  clientRequestToken,
  attemptNumber,
  now = Date.now(),
}: {
  state: RegistrationBiometricState;
  registrationSessionId: string;
  sessionId: string;
  clientRequestToken: string;
  attemptNumber: number;
  now?: number;
}): RegistrationBiometricState {
  return {
    ...state,
    attemptsCreated: attemptNumber,
    cooldownUntil: undefined,
    activeChallenge: {
      registrationSessionId,
      sessionId,
      clientRequestToken,
      attemptNumber,
      issuedAt: now,
      expiresAt: now + LIVENESS_SESSION_TTL_SECONDS * 1000,
    },
    updatedAt: now,
  };
}
