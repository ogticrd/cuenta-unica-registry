import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockIsValidCedula,
  mockIsBreachedPassword,
  mockIsPasswordStrongEnough,
} = vi.hoisted(() => ({
  mockIsValidCedula: vi.fn(),
  mockIsBreachedPassword: vi.fn(),
  mockIsPasswordStrongEnough: vi.fn(),
}));

vi.mock("@/lib/utils/cedula", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/utils/cedula")>(
      "@/lib/utils/cedula",
    );

  return {
    ...actual,
    isValidCedula: mockIsValidCedula,
  };
});

vi.mock("@/lib/utils/password", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils/password")>(
    "@/lib/utils/password",
  );

  return {
    ...actual,
    isBreachedPassword: mockIsBreachedPassword,
    isPasswordStrongEnough: mockIsPasswordStrongEnough,
  };
});

import {
  accountRequestSchema,
  createAccountSchema,
  createCedulaSchema,
} from "@/lib/schemas/registration";

const t = (key: string) => key;

describe("createCedulaSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsValidCedula.mockResolvedValue(true);
  });

  it("normalizes formatted cedulas through the real schema wiring", async () => {
    const schema = createCedulaSchema(t);

    await expect(
      schema.safeParseAsync({ cedula: "402-0061234-5" }),
    ).resolves.toMatchObject({
      success: true,
    });
    expect(mockIsValidCedula).toHaveBeenCalledWith("40200612345");
  });

  it("returns the translated invalid-length message before async validation", async () => {
    const schema = createCedulaSchema(t);

    const result = await schema.safeParseAsync({ cedula: "123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "identification.id_invalid_length",
      );
    }
    expect(mockIsValidCedula).not.toHaveBeenCalled();
  });

  it("returns the translated required message when the cedula is empty", async () => {
    const schema = createCedulaSchema(t);

    const result = await schema.safeParseAsync({ cedula: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "identification.id_required",
      );
    }
    expect(mockIsValidCedula).not.toHaveBeenCalled();
  });

  it("returns the translated invalid-cedula message when the helper rejects it", async () => {
    mockIsValidCedula.mockResolvedValueOnce(false);
    const schema = createCedulaSchema(t);

    const result = await schema.safeParseAsync({ cedula: "40200612345" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("identification.id_invalid");
    }
  });
});

describe("createAccountSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPasswordStrongEnough.mockReturnValue(true);
    mockIsBreachedPassword.mockResolvedValue(false);
  });

  it("accepts valid data through the real schema", async () => {
    const schema = createAccountSchema(t, "00100063362");

    await expect(
      schema.safeParseAsync({
        email: "user@example.com",
        confirmEmail: "user@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    ).resolves.toMatchObject({
      success: true,
    });
  });

  it("rejects password similarity to cedula", async () => {
    const schema = createAccountSchema(t, "001-0006336-2");

    const result = await schema.safeParseAsync({
      email: "user@example.com",
      confirmEmail: "user@example.com",
      password: "00100063362Aa!",
      confirmPassword: "00100063362Aa!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "account.validation.password_cedula_similarity",
      );
    }
  });

  it("rejects email mismatch using the real schema refinement", async () => {
    const schema = createAccountSchema(t);

    const result = await schema.safeParseAsync({
      email: "user@example.com",
      confirmEmail: "other@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "account.validation.email_mismatch",
      );
    }
  });

  it("rejects invalid email formats on both email fields", async () => {
    const schema = createAccountSchema(t);

    const result = await schema.safeParseAsync({
      email: "not-an-email",
      confirmEmail: "still-not-an-email",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("account.validation.email_invalid");
      expect(
        result.error.issues.filter(
          (issue) => issue.message === "account.validation.email_invalid",
        ),
      ).toHaveLength(2);
    }
  });

  it("rejects passwords that include the email local part", async () => {
    const schema = createAccountSchema(t);

    const result = await schema.safeParseAsync({
      email: "juan@example.com",
      confirmEmail: "juan@example.com",
      password: "xxJUAN123!",
      confirmPassword: "xxJUAN123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "account.validation.password_email_similarity",
      );
    }
  });

  it("rejects password confirmation mismatches", async () => {
    const schema = createAccountSchema(t);

    const result = await schema.safeParseAsync({
      email: "user@example.com",
      confirmEmail: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123?",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "account.validation.password_mismatch",
      );
    }
  });

  it("rejects weak passwords when the helper returns false", async () => {
    mockIsPasswordStrongEnough.mockReturnValueOnce(false);
    const schema = createAccountSchema(t);

    const result = await schema.safeParseAsync({
      email: "user@example.com",
      confirmEmail: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "account.validation.password_weak",
      );
    }
  });

  it("rejects compromised passwords when the breach helper returns true", async () => {
    mockIsBreachedPassword.mockResolvedValueOnce(true);
    const schema = createAccountSchema(t);

    const result = await schema.safeParseAsync({
      email: "user@example.com",
      confirmEmail: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "account.validation.password_compromised",
      );
    }
  });
});

describe("accountRequestSchema", () => {
  it("validates the real request payload contract", () => {
    expect(
      accountRequestSchema.safeParse({
        email: "user@example.com",
        password: "Password123!",
      }).success,
    ).toBe(true);

    expect(
      accountRequestSchema.safeParse({
        email: "not-an-email",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("enforces the password minimum length boundary", () => {
    expect(
      accountRequestSchema.safeParse({
        email: "user@example.com",
        password: "123456789",
      }).success,
    ).toBe(false);

    expect(
      accountRequestSchema.safeParse({
        email: "user@example.com",
        password: "1234567890",
      }).success,
    ).toBe(true);
  });
});
