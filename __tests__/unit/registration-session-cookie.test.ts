import { createHash, createHmac } from "node:crypto";
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
  createRegistrationSessionCookie,
  createRegistrationSessionCookieFromSession,
  getRegistrationSession,
} from "@/lib/services/registration/registration-session.service";

const TEST_SECRET = "test-registration-secret";
const REGISTRATION_SESSION_KEY_CONTEXT = "registration-session-cookie:v1";
const TEST_SESSION_ID = "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d";

function setRequestCookies(cookies: Record<string, string>) {
  requestCookies.clear();

  for (const [name, value] of Object.entries(cookies)) {
    requestCookies.set(name, value);
  }
}

function signSessionPayload(payload: unknown) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signingKey = createHash("sha256")
    .update(REGISTRATION_SESSION_KEY_CONTEXT)
    .update("\0")
    .update(TEST_SECRET)
    .digest();
  const signature = createHmac("sha256", signingKey)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function signLegacySessionPayloadWithoutContext(payload: unknown) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = createHmac("sha256", TEST_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function createSignedSessionPayload(overrides: Record<string, unknown> = {}) {
  const issuedAt = Date.now();

  return signSessionPayload({
    sessionId: TEST_SESSION_ID,
    cedula: "40200612345",
    status: "identified",
    issuedAt,
    expiresAt: issuedAt + 30 * 60 * 1000,
    ...overrides,
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  process.env.REGISTRATION_SESSION_SECRET = TEST_SECRET;
  setRequestCookies({});

  mockCookies.mockResolvedValue({
    get(name: string) {
      const value = requestCookies.get(name);
      return value ? { name, value } : undefined;
    },
  });
});

describe("registration session cookie", () => {
  it("returns a valid signed registration session", async () => {
    const cookie = createRegistrationSessionCookie(
      "40200612345",
      "identified",
      "https://cuentaunica.gob.do/dashboard",
    );

    setRequestCookies({ registration_session: cookie.value });

    await expect(getRegistrationSession()).resolves.toMatchObject({
      sessionId: expect.any(String),
      cedula: "40200612345",
      status: "identified",
      returnUrl: "https://cuentaunica.gob.do/dashboard",
    });
  });

  it("normalizes the cedula before signing the registration session", async () => {
    const cookie = createRegistrationSessionCookie(
      "402-0061234-5",
      "identified",
    );

    setRequestCookies({ registration_session: cookie.value });

    await expect(getRegistrationSession()).resolves.toMatchObject({
      sessionId: expect.any(String),
      cedula: "40200612345",
      status: "identified",
    });
  });

  it("promotes a session without extending the original registration window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T10:00:00.000Z"));

    const identifiedCookie = createRegistrationSessionCookie(
      "40200612345",
      "identified",
      "https://cuentaunica.gob.do/dashboard",
      TEST_SESSION_ID,
    );
    setRequestCookies({ registration_session: identifiedCookie.value });
    const identifiedSession = await getRegistrationSession();

    if (!identifiedSession) {
      throw new Error("Expected a valid identified registration session");
    }

    vi.setSystemTime(new Date("2026-06-22T10:05:00.000Z"));

    const verifiedCookie = createRegistrationSessionCookieFromSession(
      identifiedSession,
      "verified",
    );
    setRequestCookies({ registration_session: verifiedCookie.value });

    await expect(getRegistrationSession()).resolves.toMatchObject({
      sessionId: TEST_SESSION_ID,
      cedula: "40200612345",
      status: "verified",
      issuedAt: identifiedSession?.issuedAt,
      expiresAt: identifiedSession?.expiresAt,
      returnUrl: "https://cuentaunica.gob.do/dashboard",
    });
    expect(verifiedCookie.maxAge).toBe(25 * 60);
  });

  it("rejects a signed session with an unknown status", async () => {
    setRequestCookies({
      registration_session: createSignedSessionPayload({
        status: "completed",
      }),
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });

  it("rejects a signed session without a registration session id", async () => {
    setRequestCookies({
      registration_session: createSignedSessionPayload({
        sessionId: undefined,
      }),
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });

  it("rejects a signed session with an invalid registration session id", async () => {
    setRequestCookies({
      registration_session: createSignedSessionPayload({
        sessionId: "not-a-session-id",
      }),
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });

  it("rejects a signed session with a non-normalized cedula", async () => {
    setRequestCookies({
      registration_session: createSignedSessionPayload({
        cedula: "402-0061234-5",
      }),
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });

  it("rejects a signed session with a non-string return url", async () => {
    setRequestCookies({
      registration_session: createSignedSessionPayload({
        returnUrl: { href: "https://cuentaunica.gob.do/dashboard" },
      }),
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });

  it("rejects a signed session with a TTL longer than the registration window", async () => {
    const issuedAt = Date.now();

    setRequestCookies({
      registration_session: createSignedSessionPayload({
        issuedAt,
        expiresAt: issuedAt + 60 * 60 * 1000,
      }),
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });

  it("rejects a signed session issued too far in the future", async () => {
    const issuedAt = Date.now() + 5 * 60 * 1000;

    setRequestCookies({
      registration_session: createSignedSessionPayload({
        issuedAt,
        expiresAt: issuedAt + 30 * 60 * 1000,
      }),
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });

  it("rejects a signed session missing required timestamps", async () => {
    setRequestCookies({
      registration_session: signSessionPayload({
        sessionId: TEST_SESSION_ID,
        cedula: "40200612345",
        status: "identified",
      }),
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });

  it("rejects sessions signed without the registration session context", async () => {
    const issuedAt = Date.now();

    setRequestCookies({
      registration_session: signLegacySessionPayloadWithoutContext({
        sessionId: TEST_SESSION_ID,
        cedula: "40200612345",
        status: "identified",
        issuedAt,
        expiresAt: issuedAt + 30 * 60 * 1000,
      }),
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });

  it("rejects session cookies with extra segments", async () => {
    const cookie = createRegistrationSessionCookie("40200612345");

    setRequestCookies({
      registration_session: `${cookie.value}.extra`,
    });

    await expect(getRegistrationSession()).resolves.toBeNull();
  });
});
