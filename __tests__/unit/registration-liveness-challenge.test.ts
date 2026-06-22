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
  createRegistrationLivenessChallengeCookie,
  getRegistrationLivenessChallenge,
} from "@/lib/services/registration/registration-liveness-challenge.service";
import type { RegistrationSession } from "@/lib/types/registration/session";

const TEST_SESSION: RegistrationSession = {
  sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
  cedula: "40200612345",
  status: "identified",
  issuedAt: Date.now(),
  expiresAt: Date.now() + 30 * 60 * 1000,
};

function setRequestCookies(cookies: Record<string, string>) {
  requestCookies.clear();

  for (const [name, value] of Object.entries(cookies)) {
    requestCookies.set(name, value);
  }
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  process.env.REGISTRATION_SESSION_SECRET = "test-registration-secret";
  setRequestCookies({});

  mockCookies.mockResolvedValue({
    get(name: string) {
      const value = requestCookies.get(name);
      return value ? { name, value } : undefined;
    },
  });
});

describe("registration liveness challenge cookie", () => {
  it("returns a valid liveness challenge bound to the registration session", async () => {
    const cookie = createRegistrationLivenessChallengeCookie(
      TEST_SESSION,
      "session-123",
    );

    expect(cookie.name).toBe("registration_liveness_challenge");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("strict");
    setRequestCookies({ registration_liveness_challenge: cookie.value });

    await expect(getRegistrationLivenessChallenge()).resolves.toMatchObject({
      registrationSessionId: TEST_SESSION.sessionId,
      livenessSessionId: "session-123",
    });
  });

  it("does not outlive the active registration session", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T10:00:00.000Z"));

    const cookie = createRegistrationLivenessChallengeCookie(
      {
        ...TEST_SESSION,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      },
      "session-123",
    );

    expect(cookie.maxAge).toBe(5 * 60);
    setRequestCookies({ registration_liveness_challenge: cookie.value });

    vi.setSystemTime(new Date("2026-06-22T10:06:00.000Z"));

    await expect(getRegistrationLivenessChallenge()).resolves.toBeNull();
  });

  it("rejects tampered liveness challenge cookies", async () => {
    const cookie = createRegistrationLivenessChallengeCookie(
      TEST_SESSION,
      "session-123",
    );
    const tamperedValue =
      cookie.value.slice(0, -1) + (cookie.value.endsWith("a") ? "b" : "a");

    setRequestCookies({ registration_liveness_challenge: tamperedValue });

    await expect(getRegistrationLivenessChallenge()).resolves.toBeNull();
  });

  it("rejects liveness challenge cookies with extra segments", async () => {
    const cookie = createRegistrationLivenessChallengeCookie(
      TEST_SESSION,
      "session-123",
    );

    setRequestCookies({
      registration_liveness_challenge: `${cookie.value}.extra`,
    });

    await expect(getRegistrationLivenessChallenge()).resolves.toBeNull();
  });
});
