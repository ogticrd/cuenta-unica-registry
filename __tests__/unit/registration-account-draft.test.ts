import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createRegistrationAccountDraftCookie,
  parseRegistrationAccountDraftCookie,
} from "@/lib/services/registration/registration-account-draft.service";

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
});
