import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';

import {
  createSignedHash,
  parseSignedCookieValue,
  serializeSignedCookieValue,
} from './signed-cookie';
import {
  isBiometricSource,
  type BiometricErrorCode,
  type BiometricSource,
} from '@/common/biometric-contract';

export type { BiometricErrorCode, BiometricSource };

export const BIOMETRIC_STATE_COOKIE = 'biometric_state';

const BIOMETRIC_STATE_VERSION = 1;
const BIOMETRIC_STATE_CONTEXT = 'biometric-state-cookie:v1';
const BIOMETRIC_SUBJECT_CONTEXT = 'biometric-subject:v1';
const BIOMETRIC_CLIENT_TOKEN_CONTEXT = 'biometric-client-request-token:v1';
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_COOLDOWN_SECONDS = 15 * 60;
const DEFAULT_STATE_TTL_SECONDS = 30 * 60;
const LIVENESS_SESSION_TTL_SECONDS = 3 * 60;

export interface BiometricSubject {
  source: BiometricSource;
  cedula: string;
  flowId?: string;
  subjectHash: string;
}

export interface BiometricActiveChallenge {
  sessionId: string;
  clientRequestToken: string;
  attemptNumber: number;
  issuedAt: number;
  expiresAt: number;
}

export interface BiometricVerifiedState {
  sessionId: string;
  confidence: number;
  similarity: number;
  issuedAt: number;
  expiresAt: number;
}

export interface BiometricState {
  version: typeof BIOMETRIC_STATE_VERSION;
  source: BiometricSource;
  subjectHash: string;
  flowId?: string;
  attemptsCreated: number;
  cooldownUntil?: number;
  activeChallenge?: BiometricActiveChallenge;
  verified?: BiometricVerifiedState;
  issuedAt: number;
  updatedAt: number;
  expiresAt: number;
}

type PrepareBiometricAttemptResult =
  | {
      status: 'blocked';
      state: BiometricState;
      code: Extract<
        BiometricErrorCode,
        'biometric_attempt_limit_exceeded' | 'biometric_cooldown_active'
      >;
      retryAfterSeconds: number;
    }
  | {
      status: 'reuse';
      state: BiometricState;
      sessionId: string;
    }
  | {
      status: 'create';
      state: BiometricState;
      attemptNumber: number;
      clientRequestToken: string;
    };

export function getBiometricConfig() {
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

export function createBiometricSubject({
  source,
  cedula,
  flowId,
}: {
  source: BiometricSource;
  cedula: string;
  flowId?: string;
}): BiometricSubject {
  const normalizedCedula = cedula.replace(/\D/g, '');
  const subjectHash = createSignedHash(
    BIOMETRIC_SUBJECT_CONTEXT,
    source,
    normalizedCedula,
    flowId ?? '',
  );

  return {
    source,
    cedula: normalizedCedula,
    ...(flowId ? { flowId } : {}),
    subjectHash,
  };
}

function isFiniteTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isActiveChallenge(
  value: unknown,
): value is BiometricActiveChallenge {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const challenge = value as Partial<BiometricActiveChallenge>;

  return (
    typeof challenge.sessionId === 'string' &&
    challenge.sessionId.length > 0 &&
    challenge.sessionId.length <= 256 &&
    typeof challenge.clientRequestToken === 'string' &&
    /^[A-Za-z0-9-_]{1,64}$/.test(challenge.clientRequestToken) &&
    typeof challenge.attemptNumber === 'number' &&
    Number.isInteger(challenge.attemptNumber) &&
    challenge.attemptNumber > 0 &&
    isFiniteTimestamp(challenge.issuedAt) &&
    isFiniteTimestamp(challenge.expiresAt)
  );
}

function isVerifiedState(value: unknown): value is BiometricVerifiedState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const verified = value as Partial<BiometricVerifiedState>;

  return (
    typeof verified.sessionId === 'string' &&
    verified.sessionId.length > 0 &&
    typeof verified.confidence === 'number' &&
    Number.isFinite(verified.confidence) &&
    typeof verified.similarity === 'number' &&
    Number.isFinite(verified.similarity) &&
    isFiniteTimestamp(verified.issuedAt) &&
    isFiniteTimestamp(verified.expiresAt)
  );
}

function isBiometricState(value: unknown): value is BiometricState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const state = value as Partial<BiometricState>;
  const now = Date.now();

  return (
    state.version === BIOMETRIC_STATE_VERSION &&
    isBiometricSource(state.source) &&
    typeof state.subjectHash === 'string' &&
    state.subjectHash.length > 0 &&
    (state.flowId === undefined || typeof state.flowId === 'string') &&
    typeof state.attemptsCreated === 'number' &&
    Number.isInteger(state.attemptsCreated) &&
    state.attemptsCreated >= 0 &&
    (state.cooldownUntil === undefined ||
      isFiniteTimestamp(state.cooldownUntil)) &&
    (state.activeChallenge === undefined ||
      isActiveChallenge(state.activeChallenge)) &&
    (state.verified === undefined || isVerifiedState(state.verified)) &&
    isFiniteTimestamp(state.issuedAt) &&
    isFiniteTimestamp(state.updatedAt) &&
    isFiniteTimestamp(state.expiresAt) &&
    state.expiresAt > now
  );
}

function createEmptyState(
  subject: BiometricSubject,
  now = Date.now(),
): BiometricState {
  const { stateTtlSeconds } = getBiometricConfig();

  return {
    version: BIOMETRIC_STATE_VERSION,
    source: subject.source,
    subjectHash: subject.subjectHash,
    ...(subject.flowId ? { flowId: subject.flowId } : {}),
    attemptsCreated: 0,
    issuedAt: now,
    updatedAt: now,
    expiresAt: now + stateTtlSeconds * 1000,
  } satisfies BiometricState;
}

function isStateForSubject(
  state: BiometricState | null,
  subject: BiometricSubject,
  now = Date.now(),
): state is BiometricState {
  return (
    !!state &&
    state.expiresAt > now &&
    state.source === subject.source &&
    state.subjectHash === subject.subjectHash &&
    (state.flowId ?? '') === (subject.flowId ?? '')
  );
}

function normalizeState(
  state: BiometricState | null,
  subject: BiometricSubject,
  now = Date.now(),
): BiometricState {
  if (!isStateForSubject(state, subject, now)) {
    return createEmptyState(subject, now);
  }

  if (state.cooldownUntil && state.cooldownUntil <= now) {
    return createEmptyState(subject, now);
  }

  return {
    ...state,
    activeChallenge:
      state.activeChallenge && state.activeChallenge.expiresAt > now
        ? state.activeChallenge
        : undefined,
    verified:
      state.verified && state.verified.expiresAt > now
        ? state.verified
        : undefined,
  };
}

export async function getBiometricState(): Promise<BiometricState | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(BIOMETRIC_STATE_COOKIE)?.value;

  if (!cookieValue) {
    return null;
  }

  return parseSignedCookieValue(
    cookieValue,
    BIOMETRIC_STATE_CONTEXT,
    isBiometricState,
  );
}

function getCookieBaseOptions(): Pick<
  ResponseCookie,
  'httpOnly' | 'maxAge' | 'path' | 'sameSite' | 'secure'
> {
  const { stateTtlSeconds } = getBiometricConfig();

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: stateTtlSeconds,
    sameSite: 'strict',
    path: '/',
  };
}

export function createBiometricStateCookie(
  state: BiometricState,
): ResponseCookie {
  return {
    name: BIOMETRIC_STATE_COOKIE,
    value: serializeSignedCookieValue(state, BIOMETRIC_STATE_CONTEXT),
    ...getCookieBaseOptions(),
    maxAge: Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 1000)),
  };
}

export function clearBiometricStateCookie(): ResponseCookie {
  return {
    name: BIOMETRIC_STATE_COOKIE,
    value: '',
    ...getCookieBaseOptions(),
    maxAge: 0,
  };
}

export function prepareBiometricAttempt({
  state,
  subject,
  forceNew,
  now = Date.now(),
}: {
  state: BiometricState | null;
  subject: BiometricSubject;
  forceNew: boolean;
  now?: number;
}): PrepareBiometricAttemptResult {
  const config = getBiometricConfig();
  const normalizedState = normalizeState(state, subject, now);

  if (
    normalizedState.cooldownUntil &&
    normalizedState.cooldownUntil > now
  ) {
    return {
      status: 'blocked',
      state: normalizedState,
      code: 'biometric_cooldown_active',
      retryAfterSeconds: Math.ceil(
        (normalizedState.cooldownUntil - now) / 1000,
      ),
    };
  }

  if (!forceNew && normalizedState.activeChallenge) {
    return {
      status: 'reuse',
      state: normalizedState,
      sessionId: normalizedState.activeChallenge.sessionId,
    };
  }

  if (normalizedState.attemptsCreated >= config.maxAttempts) {
    const cooldownUntil = now + config.cooldownSeconds * 1000;
    const blockedState: BiometricState = {
      ...normalizedState,
      activeChallenge: undefined,
      cooldownUntil,
      updatedAt: now,
    };

    return {
      status: 'blocked',
      state: blockedState,
      code: 'biometric_attempt_limit_exceeded',
      retryAfterSeconds: config.cooldownSeconds,
    };
  }

  const attemptNumber = normalizedState.attemptsCreated + 1;
  const clientRequestToken = createSignedHash(
    BIOMETRIC_CLIENT_TOKEN_CONTEXT,
    subject.source,
    subject.subjectHash,
    subject.flowId ?? '',
    String(normalizedState.issuedAt),
    String(attemptNumber),
  ).slice(0, 64);

  return {
    status: 'create',
    state: normalizedState,
    attemptNumber,
    clientRequestToken,
  };
}

export function recordBiometricSessionCreated({
  state,
  sessionId,
  clientRequestToken,
  attemptNumber,
  now = Date.now(),
}: {
  state: BiometricState;
  sessionId: string;
  clientRequestToken: string;
  attemptNumber: number;
  now?: number;
}): BiometricState {
  return {
    ...state,
    attemptsCreated: attemptNumber,
    cooldownUntil: undefined,
    activeChallenge: {
      sessionId,
      clientRequestToken,
      attemptNumber,
      issuedAt: now,
      expiresAt: now + LIVENESS_SESSION_TTL_SECONDS * 1000,
    },
    updatedAt: now,
  };
}

export function recordBiometricFailure(
  state: BiometricState,
  sessionId: string,
  now = Date.now(),
): BiometricState {
  if (state.activeChallenge?.sessionId !== sessionId) {
    return state;
  }

  return {
    ...state,
    activeChallenge: undefined,
    updatedAt: now,
  };
}

export function recordBiometricSuccess({
  state,
  sessionId,
  confidence,
  similarity,
  now = Date.now(),
}: {
  state: BiometricState;
  sessionId: string;
  confidence: number;
  similarity: number;
  now?: number;
}): BiometricState {
  return {
    ...state,
    activeChallenge: undefined,
    verified: {
      sessionId,
      confidence,
      similarity,
      issuedAt: now,
      expiresAt: state.expiresAt,
    },
    updatedAt: now,
  };
}

export function isBiometricChallengeValid({
  state,
  subject,
  sessionId,
  now = Date.now(),
}: {
  state: BiometricState | null;
  subject: BiometricSubject;
  sessionId: string;
  now?: number;
}) {
  return (
    isStateForSubject(state, subject, now) &&
    state.activeChallenge?.sessionId === sessionId &&
    state.activeChallenge.expiresAt > now
  );
}

export async function hasCompletedBiometricVerification(
  subject: BiometricSubject,
) {
  const state = await getBiometricState();
  const now = Date.now();

  return (
    isStateForSubject(state, subject, now) &&
    !!state.verified &&
    state.verified.expiresAt > now
  );
}
