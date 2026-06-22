import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockIsBreachedPassword } = vi.hoisted(() => ({
  mockIsBreachedPassword: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/utils/password", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils/password")>();

  return {
    ...actual,
    isBreachedPassword: mockIsBreachedPassword,
  };
});

import { validateRegistrationAccountCredentials } from "@/lib/services/registration/account-credential-validation.service";

describe("validateRegistrationAccountCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBreachedPassword.mockResolvedValue(false);
  });

  it("accepts strong passwords that do not include personal identifiers", async () => {
    await expect(
      validateRegistrationAccountCredentials(
        {
          email: "user@example.com",
          password: "GovFlow92817Z!",
        },
        {
          cedula: "40214041176",
        },
      ),
    ).resolves.toBeNull();
    expect(mockIsBreachedPassword).toHaveBeenCalledWith("GovFlow92817Z!");
  });

  it("rejects passwords containing the normalized cedula before other checks", async () => {
    await expect(
      validateRegistrationAccountCredentials(
        {
          email: "user@example.com",
          password: "User40214041176!",
        },
        {
          cedula: "402-1404117-6",
        },
      ),
    ).resolves.toEqual({
      code: "password_cedula_similarity",
      fieldErrors: {
        password: "account.validation.password_cedula_similarity",
      },
    });
    expect(mockIsBreachedPassword).not.toHaveBeenCalled();
  });

  it("rejects passwords containing the email local part case-insensitively", async () => {
    await expect(
      validateRegistrationAccountCredentials(
        {
          email: "marluan@example.com",
          password: "MARLUAN92817!",
        },
        {
          cedula: "40214041176",
        },
      ),
    ).resolves.toEqual({
      code: "password_email_similarity",
      fieldErrors: {
        password: "account.validation.password_email_similarity",
      },
    });
    expect(mockIsBreachedPassword).not.toHaveBeenCalled();
  });

  it("rejects passwords that do not satisfy strength requirements", async () => {
    await expect(
      validateRegistrationAccountCredentials(
        {
          email: "user@example.com",
          password: "abcdefghij",
        },
        {
          cedula: "40214041176",
        },
      ),
    ).resolves.toEqual({
      code: "password_weak",
      fieldErrors: {
        password: "account.validation.password_weak",
      },
    });
    expect(mockIsBreachedPassword).not.toHaveBeenCalled();
  });

  it("rejects strong passwords found in breach corpuses", async () => {
    mockIsBreachedPassword.mockResolvedValueOnce(true);

    await expect(
      validateRegistrationAccountCredentials(
        {
          email: "user@example.com",
          password: "GovFlow92817Z!",
        },
        {
          cedula: "40214041176",
        },
      ),
    ).resolves.toEqual({
      code: "password_compromised",
      fieldErrors: {
        password: "account.validation.password_compromised",
      },
    });
  });
});
