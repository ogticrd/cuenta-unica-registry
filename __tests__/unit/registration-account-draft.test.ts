import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createRegistrationAccountDraftCookie,
  parseRegistrationAccountDraftCookie,
  serializeRegistrationAccountDraft,
} from "@/lib/services/registration/registration-account-draft.service";

function createEncryptedDraftPayload(overrides: Record<string, unknown> = {}) {
  const issuedAt = Date.now();

  return serializeRegistrationAccountDraft({
    cedula: "40224888319",
    email: "marluanespiritusanto@gmail.com",
    password: "GovFlow92817Z!",
    issuedAt,
    expiresAt: issuedAt + 30 * 60 * 1000,
    ...overrides,
  });
}

describe("registration account draft cookie", () => {
  beforeEach(() => {
    vi.useRealTimers();
    process.env.REGISTRATION_SESSION_SECRET = "test-registration-secret";
  });

  it("encrypts and decrypts the account draft without exposing sensitive values", () => {
    const cookie = createRegistrationAccountDraftCookie({
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
      cedula: "40224888319",
      email: "marluanespiritusanto@gmail.com",
      password: "GovFlow92817Z!",
    });
  });

  it("rejects tampered draft cookies", () => {
    const cookie = createRegistrationAccountDraftCookie({
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

  it("rejects expired draft cookies", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T10:00:00.000Z"));

    const cookie = createRegistrationAccountDraftCookie({
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
          cedula: "40224888319",
          email: "marluanespiritusanto@gmail.com",
          password: "GovFlow92817Z!",
        } as never),
      ),
    ).toBeNull();
  });
});
