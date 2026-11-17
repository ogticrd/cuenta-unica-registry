import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestCookies, mockCookies } = vi.hoisted(() => ({
  requestCookies: new Map<string, string>(),
  mockCookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("server-only", () => ({}));

import {
  createRegistrationBiometricStateCookie,
  getRegistrationBiometricState,
  prepareRegistrationBiometricAttempt,
  recordRegistrationBiometricSessionCreated,
} from "@/lib/services/registration/registration-biometric-attempt.service";
import type { RegistrationSession } from "@/lib/types/registration/session";

const REGISTRATION_SESSION: RegistrationSession = {
  sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
  cedula: "40200612345",
  status: "identified",
  issuedAt: Date.now(),
  expiresAt: Date.now() + 30 * 60 * 1000,
};

function setRequestCookies(values: Record<string, string>) {
  requestCookies.clear();

  for (const [name, value] of Object.entries(values)) {
    requestCookies.set(name, value);
  }
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  process.env.REGISTRATION_SESSION_SECRET = "test-registration-secret";
  delete process.env.BIOMETRIC_MAX_ATTEMPTS;
  delete process.env.BIOMETRIC_COOLDOWN_SECONDS;
  delete process.env.BIOMETRIC_STATE_TTL_SECONDS;
  setRequestCookies({});

  mockCookies.mockResolvedValue({
    get(name: string) {
      const value = requestCookies.get(name);
      return value ? { name, value } : undefined;
    },
  });
});

describe("registration biometric attempt state", () => {
  it("reuses an active liveness session", () => {
    const now = Date.now();
    const firstAttempt = prepareRegistrationBiometricAttempt({
      state: null,
      registrationSession: REGISTRATION_SESSION,
      forceNew: false,
      now,
    });

    expect(firstAttempt.status).toBe("create");
    if (firstAttempt.status !== "create") return;

    const state = recordRegistrationBiometricSessionCreated({
      state: firstAttempt.state,
      registrationSessionId: REGISTRATION_SESSION.sessionId,
      sessionId: "liveness-session-1",
      clientRequestToken: firstAttempt.clientRequestToken,
      attemptNumber: firstAttempt.attemptNumber,
      now,
    });
    const reusedAttempt = prepareRegistrationBiometricAttempt({
      state,
      registrationSession: REGISTRATION_SESSION,
      forceNew: false,
      now: now + 1_000,
    });

    expect(reusedAttempt).toMatchObject({
      status: "reuse",
      sessionId: "liveness-session-1",
    });
  });

  it("blocks for 15 minutes after three created sessions", () => {
    const now = Date.now();
    let state = prepareRegistrationBiometricAttempt({
      state: null,
      registrationSession: REGISTRATION_SESSION,
      forceNew: true,
      now,
    }).state;

    for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber += 1) {
      const attempt = prepareRegistrationBiometricAttempt({
        state,
        registrationSession: REGISTRATION_SESSION,
        forceNew: true,
        now: now + attemptNumber,
      });

      expect(attempt.status).toBe("create");
      if (attempt.status !== "create") return;

      state = recordRegistrationBiometricSessionCreated({
        state: attempt.state,
        registrationSessionId: REGISTRATION_SESSION.sessionId,
        sessionId: `liveness-session-${attemptNumber}`,
        clientRequestToken: attempt.clientRequestToken,
        attemptNumber: attempt.attemptNumber,
        now: now + attemptNumber,
      });
    }

    const blocked = prepareRegistrationBiometricAttempt({
      state,
      registrationSession: REGISTRATION_SESSION,
      forceNew: true,
      now: now + 10,
    });

    expect(blocked).toMatchObject({
      status: "blocked",
      code: "biometric_attempt_limit_exceeded",
      retryAfterSeconds: 900,
    });

    const stillBlocked = prepareRegistrationBiometricAttempt({
      state: blocked.state,
      registrationSession: REGISTRATION_SESSION,
      forceNew: true,
      now: now + 10 + 60_000,
    });

    expect(stillBlocked).toMatchObject({
      status: "blocked",
      code: "biometric_cooldown_active",
      retryAfterSeconds: 840,
    });
  });

  it("resets the attempt window after the cooldown expires", () => {
    process.env.BIOMETRIC_MAX_ATTEMPTS = "1";
    process.env.BIOMETRIC_COOLDOWN_SECONDS = "10";
    const now = Date.now();
    const first = prepareRegistrationBiometricAttempt({
      state: null,
      registrationSession: REGISTRATION_SESSION,
      forceNew: true,
      now,
    });
    if (first.status !== "create") return;
    const usedState = recordRegistrationBiometricSessionCreated({
      state: first.state,
      registrationSessionId: REGISTRATION_SESSION.sessionId,
      sessionId: "liveness-session-1",
      clientRequestToken: first.clientRequestToken,
      attemptNumber: first.attemptNumber,
      now,
    });
    const blocked = prepareRegistrationBiometricAttempt({
      state: usedState,
      registrationSession: REGISTRATION_SESSION,
      forceNew: true,
      now: now + 1,
    });
    const nextWindow = prepareRegistrationBiometricAttempt({
      state: blocked.state,
      registrationSession: REGISTRATION_SESSION,
      forceNew: true,
      now: now + 10_002,
    });

    expect(nextWindow).toMatchObject({ status: "create", attemptNumber: 1 });
  });

  it("stores a signed HttpOnly cookie and rejects tampering", async () => {
    const attempt = prepareRegistrationBiometricAttempt({
      state: null,
      registrationSession: REGISTRATION_SESSION,
      forceNew: false,
    });
    const cookie = createRegistrationBiometricStateCookie(attempt.state);

    expect(cookie.name).toBe("registration_biometric_state");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("strict");

    setRequestCookies({ registration_biometric_state: cookie.value });
    await expect(getRegistrationBiometricState()).resolves.toMatchObject({
      attemptsCreated: 0,
    });

    const tamperedValue =
      cookie.value.slice(0, -1) + (cookie.value.endsWith("a") ? "b" : "a");
    setRequestCookies({ registration_biometric_state: tamperedValue });
    await expect(getRegistrationBiometricState()).resolves.toBeNull();
  });
});
