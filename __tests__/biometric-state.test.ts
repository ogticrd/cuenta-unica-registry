import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestCookies, mockCookies } = vi.hoisted(() => ({
  requestCookies: new Map<string, string>(),
  mockCookies: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}));

import {
  BIOMETRIC_STATE_COOKIE,
  createBiometricStateCookie,
  createBiometricSubject,
  getBiometricState,
  isBiometricChallengeValid,
  prepareBiometricAttempt,
  recordBiometricFailure,
  recordBiometricSessionCreated,
} from '@/common/helpers/biometric-state';

function setRequestCookies(cookies: Record<string, string>) {
  requestCookies.clear();

  for (const [name, value] of Object.entries(cookies)) {
    requestCookies.set(name, value);
  }
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  process.env.SITE_COOKIE_KEY = 'test-site-cookie-key';
  process.env.BIOMETRIC_MAX_ATTEMPTS = '3';
  process.env.BIOMETRIC_COOLDOWN_SECONDS = '900';
  process.env.BIOMETRIC_STATE_TTL_SECONDS = '1800';
  setRequestCookies({});

  mockCookies.mockResolvedValue({
    get(name: string) {
      const value = requestCookies.get(name);
      return value ? { name, value } : undefined;
    },
  });
});

describe('biometric state cookie', () => {
  it('returns a valid signed biometric state', async () => {
    const subject = createBiometricSubject({
      source: 'registration',
      cedula: '402-0061234-5',
    });
    const attempt = prepareBiometricAttempt({
      state: null,
      subject,
      forceNew: false,
    });

    if (attempt.status !== 'create') {
      throw new Error('Expected create attempt');
    }

    expect(attempt.clientRequestToken).toMatch(/^[A-Za-z0-9-_]{1,64}$/);

    const state = recordBiometricSessionCreated({
      state: attempt.state,
      sessionId: 'session-123',
      clientRequestToken: attempt.clientRequestToken,
      attemptNumber: attempt.attemptNumber,
    });
    const cookie = createBiometricStateCookie(state);

    setRequestCookies({ [BIOMETRIC_STATE_COOKIE]: cookie.value });

    await expect(getBiometricState()).resolves.toMatchObject({
      source: 'registration',
      subjectHash: subject.subjectHash,
      attemptsCreated: 1,
      activeChallenge: {
        sessionId: 'session-123',
      },
    });
  });

  it('rejects tampered biometric state cookies', async () => {
    const subject = createBiometricSubject({
      source: 'registration',
      cedula: '40200612345',
    });
    const attempt = prepareBiometricAttempt({
      state: null,
      subject,
      forceNew: false,
    });

    if (attempt.status !== 'create') {
      throw new Error('Expected create attempt');
    }

    const state = recordBiometricSessionCreated({
      state: attempt.state,
      sessionId: 'session-123',
      clientRequestToken: attempt.clientRequestToken,
      attemptNumber: attempt.attemptNumber,
    });
    const cookie = createBiometricStateCookie(state);
    const tamperedValue =
      cookie.value.slice(0, -1) + (cookie.value.endsWith('a') ? 'b' : 'a');

    setRequestCookies({ [BIOMETRIC_STATE_COOKIE]: tamperedValue });

    await expect(getBiometricState()).resolves.toBeNull();
  });

  it('rejects expired biometric state cookies', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T10:00:00.000Z'));

    const subject = createBiometricSubject({
      source: 'registration',
      cedula: '40200612345',
    });
    const attempt = prepareBiometricAttempt({
      state: null,
      subject,
      forceNew: false,
    });

    if (attempt.status !== 'create') {
      throw new Error('Expected create attempt');
    }

    const state = recordBiometricSessionCreated({
      state: attempt.state,
      sessionId: 'session-123',
      clientRequestToken: attempt.clientRequestToken,
      attemptNumber: attempt.attemptNumber,
    });
    const cookie = createBiometricStateCookie(state);

    setRequestCookies({ [BIOMETRIC_STATE_COOKIE]: cookie.value });
    vi.setSystemTime(new Date('2026-07-07T10:31:00.000Z'));

    await expect(getBiometricState()).resolves.toBeNull();
  });

  it('rejects challenges from another biometric subject', () => {
    const subject = createBiometricSubject({
      source: 'registration',
      cedula: '40200612345',
    });
    const otherSubject = createBiometricSubject({
      source: 'registration',
      cedula: '00112345678',
    });
    const attempt = prepareBiometricAttempt({
      state: null,
      subject,
      forceNew: false,
    });

    if (attempt.status !== 'create') {
      throw new Error('Expected create attempt');
    }

    const state = recordBiometricSessionCreated({
      state: attempt.state,
      sessionId: 'session-123',
      clientRequestToken: attempt.clientRequestToken,
      attemptNumber: attempt.attemptNumber,
    });

    expect(
      isBiometricChallengeValid({
        state,
        subject: otherSubject,
        sessionId: 'session-123',
      }),
    ).toBe(false);
  });

  it('preserves cooldown and starts a new attempt window after it expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T10:00:00.000Z'));
    process.env.BIOMETRIC_MAX_ATTEMPTS = '1';

    const subject = createBiometricSubject({
      source: 'registration',
      cedula: '40200612345',
    });
    const attempt = prepareBiometricAttempt({
      state: null,
      subject,
      forceNew: false,
    });

    if (attempt.status !== 'create') {
      throw new Error('Expected create attempt');
    }

    const failedState = recordBiometricFailure(
      recordBiometricSessionCreated({
        state: attempt.state,
        sessionId: 'session-123',
        clientRequestToken: attempt.clientRequestToken,
        attemptNumber: attempt.attemptNumber,
      }),
      'session-123',
    );
    const blocked = prepareBiometricAttempt({
      state: failedState,
      subject,
      forceNew: true,
    });

    expect(blocked).toMatchObject({
      status: 'blocked',
      retryAfterSeconds: 900,
    });

    if (blocked.status !== 'blocked') {
      throw new Error('Expected blocked attempt');
    }

    vi.setSystemTime(new Date('2026-07-07T10:10:00.000Z'));

    expect(
      prepareBiometricAttempt({
        state: blocked.state,
        subject,
        forceNew: true,
      }),
    ).toMatchObject({
      status: 'blocked',
      retryAfterSeconds: 300,
    });

    vi.setSystemTime(new Date('2026-07-07T10:16:00.000Z'));

    const nextAttempt = prepareBiometricAttempt({
      state: blocked.state,
      subject,
      forceNew: true,
    });

    expect(nextAttempt).toMatchObject({
      status: 'create',
      attemptNumber: 1,
    });
  });
});
