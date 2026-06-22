import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createRegistrationAccountDraftCookie,
  parseRegistrationAccountDraftCookie,
  type RegistrationAccountDraft,
  serializeRegistrationAccountDraft,
} from "@/lib/services/registration/registration-account-draft.service";

const TEST_REGISTRATION_SESSION_ID = "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d";

function getSessionExpiresAt() {
  return Date.now() + 30 * 60 * 1000;
}

function createEncryptedDraftPayload(overrides: Record<string, unknown> = {}) {
  const issuedAt = Date.now();

  return serializeRegistrationAccountDraft({
    sessionId: TEST_REGISTRATION_SESSION_ID,
    cedula: "40224888319",
    email: "marluanespiritusanto@gmail.com",
    password: "GovFlow92817Z!",
    issuedAt,
    expiresAt: issuedAt + 30 * 60 * 1000,
    ...overrides,
  });
}

function serializeLegacyDraftWithoutContext(draft: RegistrationAccountDraft) {
  const iv = randomBytes(12);
  const key = createHash("sha256")
    .update(process.env.REGISTRATION_SESSION_SECRET ?? "")
    .digest();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(draft), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    Buffer.from(iv).toString("base64url"),
    Buffer.from(ciphertext).toString("base64url"),
    Buffer.from(authTag).toString("base64url"),
  ].join(".");
}

describe("registration account draft cookie", () => {
  beforeEach(() => {
    vi.useRealTimers();
    process.env.REGISTRATION_SESSION_SECRET = "test-registration-secret";
  });

  it("encrypts and decrypts the account draft without exposing sensitive values", () => {
    const cookie = createRegistrationAccountDraftCookie({
      sessionId: TEST_REGISTRATION_SESSION_ID,
      sessionExpiresAt: getSessionExpiresAt(),
      cedula: "40224888319",
      email: "marluanespiritusanto@gmail.com",
      password: "GovFlow92817Z!",
    });

    expect(cookie.name).toBe("registration_account_draft");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("strict");
    expect(cookie.value).not.toContain("40224888319");
    expect(cookie.value).not.toContain("marluanespiritusanto@gmail.com");
    expect(cookie.value).not.toContain("GovFlow92817Z!");

    expect(parseRegistrationAccountDraftCookie(cookie.value)).toMatchObject({
      sessionId: TEST_REGISTRATION_SESSION_ID,
      cedula: "40224888319",
      email: "marluanespiritusanto@gmail.com",
      password: "GovFlow92817Z!",
    });
  });

  it("rejects tampered draft cookies", () => {
    const cookie = createRegistrationAccountDraftCookie({
      sessionId: TEST_REGISTRATION_SESSION_ID,
      sessionExpiresAt: getSessionExpiresAt(),
      cedula: "40224888319",
      email: "marluanespiritusanto@gmail.com",
      password: "GovFlow92817Z!",
    });
    const [version, iv, ciphertext, authTag] = cookie.value.split(".");
    const tamperedCiphertext =
      (ciphertext?.startsWith("a") ? "b" : "a") + ciphertext?.slice(1);
    const tamperedValue = [version, iv, tamperedCiphertext, authTag].join(".");

    expect(parseRegistrationAccountDraftCookie(tamperedValue)).toBeNull();
  });

  it("rejects draft cookies with extra segments", () => {
    const cookie = createRegistrationAccountDraftCookie({
      sessionId: TEST_REGISTRATION_SESSION_ID,
      sessionExpiresAt: getSessionExpiresAt(),
      cedula: "40224888319",
      email: "marluanespiritusanto@gmail.com",
      password: "GovFlow92817Z!",
    });

    expect(
      parseRegistrationAccountDraftCookie(`${cookie.value}.extra`),
    ).toBeNull();
  });

  it("rejects drafts encrypted without the account draft cookie context", () => {
    const issuedAt = Date.now();
    const legacyCookieValue = serializeLegacyDraftWithoutContext({
      sessionId: TEST_REGISTRATION_SESSION_ID,
      cedula: "40224888319",
      email: "marluanespiritusanto@gmail.com",
      password: "GovFlow92817Z!",
      issuedAt,
      expiresAt: issuedAt + 30 * 60 * 1000,
    });

    expect(parseRegistrationAccountDraftCookie(legacyCookieValue)).toBeNull();
  });

  it("does not outlive the active registration session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T10:00:00.000Z"));

    const sessionExpiresAt = Date.now() + 10 * 60 * 1000;
    const cookie = createRegistrationAccountDraftCookie({
      sessionId: TEST_REGISTRATION_SESSION_ID,
      sessionExpiresAt,
      cedula: "40224888319",
      email: "marluanespiritusanto@gmail.com",
      password: "GovFlow92817Z!",
    });
    const draft = parseRegistrationAccountDraftCookie(cookie.value);

    expect(cookie.maxAge).toBe(10 * 60);
    expect(draft).toMatchObject({
      expiresAt: sessionExpiresAt,
    });

    vi.setSystemTime(new Date("2026-06-22T10:11:00.000Z"));

    expect(parseRegistrationAccountDraftCookie(cookie.value)).toBeNull();
  });

  it("rejects expired draft cookies", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T10:00:00.000Z"));

    const cookie = createRegistrationAccountDraftCookie({
      sessionId: TEST_REGISTRATION_SESSION_ID,
      sessionExpiresAt: getSessionExpiresAt(),
      cedula: "40224888319",
      email: "marluanespiritusanto@gmail.com",
      password: "GovFlow92817Z!",
    });

    vi.setSystemTime(new Date("2026-06-22T10:31:00.000Z"));

    expect(parseRegistrationAccountDraftCookie(cookie.value)).toBeNull();
  });

  it("rejects encrypted drafts with a non-normalized cedula", () => {
    expect(
      parseRegistrationAccountDraftCookie(
        createEncryptedDraftPayload({ cedula: "402-2488831-9" }),
      ),
    ).toBeNull();
  });

  it("rejects encrypted drafts without a registration session id", () => {
    expect(
      parseRegistrationAccountDraftCookie(
        createEncryptedDraftPayload({ sessionId: undefined }),
      ),
    ).toBeNull();
  });

  it("rejects encrypted drafts with an invalid registration session id", () => {
    expect(
      parseRegistrationAccountDraftCookie(
        createEncryptedDraftPayload({ sessionId: "not-a-session-id" }),
      ),
    ).toBeNull();
  });

  it("rejects encrypted drafts with an invalid email", () => {
    expect(
      parseRegistrationAccountDraftCookie(
        createEncryptedDraftPayload({ email: "not-an-email" }),
      ),
    ).toBeNull();
  });

  it("rejects encrypted drafts with an invalid password payload", () => {
    expect(
      parseRegistrationAccountDraftCookie(
        createEncryptedDraftPayload({ password: "short" }),
      ),
    ).toBeNull();
  });

  it("rejects encrypted drafts with a TTL longer than the registration window", () => {
    const issuedAt = Date.now();

    expect(
      parseRegistrationAccountDraftCookie(
        createEncryptedDraftPayload({
          issuedAt,
          expiresAt: issuedAt + 60 * 60 * 1000,
        }),
      ),
    ).toBeNull();
  });

  it("rejects encrypted drafts issued too far in the future", () => {
    const issuedAt = Date.now() + 5 * 60 * 1000;

    expect(
      parseRegistrationAccountDraftCookie(
        createEncryptedDraftPayload({
          issuedAt,
          expiresAt: issuedAt + 30 * 60 * 1000,
        }),
      ),
    ).toBeNull();
  });

  it("rejects encrypted drafts missing required timestamps", () => {
    expect(
      parseRegistrationAccountDraftCookie(
        serializeRegistrationAccountDraft({
          sessionId: TEST_REGISTRATION_SESSION_ID,
          cedula: "40224888319",
          email: "marluanespiritusanto@gmail.com",
          password: "GovFlow92817Z!",
        } as never),
      ),
    ).toBeNull();
  });
});
