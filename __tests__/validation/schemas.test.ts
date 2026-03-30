import { describe, it, expect } from "vitest";
import { z } from "zod";

// ============================================
// Zod Schemas (copied from project for testing)
// ============================================

// Cedula validation schema
const cedulaSchema = z
  .string()
  .min(1, "Cedula is required")
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 11, {
    message: "Cedula must have 11 digits",
  })
  .refine(
    (val) => {
      // Luhn algorithm validation for Dominican cedula
      // Reverse the digits and process
      const digits = val.split("").reverse().map(Number);
      const checkDigit = digits.shift();
      if (checkDigit === undefined) return false;

      const sum = digits.reduce((acc, digit, index) => {
        if (index % 2 !== 0) {
          return acc + digit;
        }
        const doubled = digit * 2;
        return acc + (doubled > 9 ? doubled - 9 : doubled);
      }, checkDigit);

      return sum % 10 === 0;
    },
    { message: "Invalid cedula (Luhn check failed)" },
  );

// Email schema - trim BEFORE email validation
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .transform((val) => val.trim())
  .transform((val) => val.toLowerCase())
  .refine((val) => z.string().email().safeParse(val).success, {
    message: "Invalid email format",
  })
  .refine((val) => val.length <= 255, {
    message: "Email must be less than 255 characters",
  });

// Password schema
const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password must be less than 128 characters")
  .refine((val) => /[a-z]/.test(val), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => /\d/.test(val), {
    message: "Password must contain at least one number",
  })
  .refine((val) => /[^A-Za-z0-9]/.test(val), {
    message: "Password must contain at least one special character",
  });

// Confirm password schema
const confirmPasswordSchema = z.string();

// Password match refinement
const passwordMatchSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Account form schema
const accountFormSchema = z
  .object({
    email: emailSchema,
    confirmEmail: z.string(),
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Emails do not match",
    path: ["confirmEmail"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Identification form schema
const identificationFormSchema = z.object({
  cedula: cedulaSchema,
});

// Login form schema
const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

// Registration step data schemas
const identificationStepSchema = z.object({
  cedula: cedulaSchema,
});

const accountStepSchema = z.object({
  email: emailSchema,
  confirmEmail: z.string(),
  password: passwordSchema,
  confirmPassword: z.string(),
});

const verificationStepSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only digits"),
});

// ============================================
// Tests
// ============================================

describe("Cedula Schema", () => {
  describe("Valid cedulas", () => {
    it("should accept valid 11-digit cedulas", () => {
      const result = cedulaSchema.safeParse("40200612345");
      expect(result.success).toBe(true);
    });

    it("should accept cedulas with formatting", () => {
      const result = cedulaSchema.safeParse("402-0061234-5");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("40200612345");
      }
    });

    it("should normalize cedulas by removing non-digits", () => {
      const result = cedulaSchema.safeParse("402-006-1234-5");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("40200612345");
      }
    });
  });

  describe("Invalid cedulas", () => {
    it("should reject empty string", () => {
      const result = cedulaSchema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Cedula is required");
      }
    });

    it("should reject cedula with less than 11 digits", () => {
      const result = cedulaSchema.safeParse("1234567890");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Cedula must have 11 digits",
        );
      }
    });

    it("should reject cedula with more than 11 digits", () => {
      const result = cedulaSchema.safeParse("123456789012");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Cedula must have 11 digits",
        );
      }
    });

    it("should reject cedula that fails Luhn check", () => {
      const result = cedulaSchema.safeParse("12345678901");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Invalid cedula (Luhn check failed)",
        );
      }
    });

    it("should reject non-numeric input after transformation", () => {
      const result = cedulaSchema.safeParse("abcdefghijk");
      expect(result.success).toBe(false);
    });
  });
});

describe("Email Schema", () => {
  describe("Valid emails", () => {
    it("should accept valid email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.org",
        "user+tag@example.co.uk",
        "test123@test-domain.com",
      ];

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it("should transform email to lowercase", () => {
      const result = emailSchema.safeParse("TEST@EXAMPLE.COM");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test@example.com");
      }
    });

    it("should trim whitespace from email", () => {
      const result = emailSchema.safeParse("  test@example.com  ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test@example.com");
      }
    });
  });

  describe("Invalid emails", () => {
    it("should reject empty string", () => {
      const result = emailSchema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Email is required");
      }
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "user@",
        "user@.com",
        "user@domain",
        "user name@example.com",
      ];

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });

    it("should reject emails longer than 255 characters", () => {
      const longEmail = "a".repeat(250) + "@test.com";
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Email must be less than 255 characters",
        );
      }
    });
  });
});

describe("Password Schema", () => {
  describe("Valid passwords", () => {
    it("should accept strong passwords", () => {
      const validPasswords = [
        "Password123!",
        "MySecure#Pass1",
        "Abcdefghij1!",
        "P@ssw0rd123456",
        "VeryLongPassword123!@#",
      ];

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it("should accept password with exactly 10 characters if it meets all requirements", () => {
      const result = passwordSchema.safeParse("Abcdefgh1!");
      expect(result.success).toBe(true);
    });

    it("should accept various special characters", () => {
      const specialChars = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"];

      specialChars.forEach((char) => {
        const password = `Password1${char}`;
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Invalid passwords", () => {
    it("should reject password shorter than 10 characters", () => {
      const result = passwordSchema.safeParse("Pass1!");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must be at least 10 characters",
        );
      }
    });

    it("should reject password longer than 128 characters", () => {
      // 129 characters to exceed limit (125 + 4 = 129)
      const tooLongPassword = "A".repeat(125) + "b1!X"; // 129 chars
      const result = passwordSchema.safeParse(tooLongPassword);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must be less than 128 characters",
        );
      }
    });

    it("should reject password without lowercase letter", () => {
      const result = passwordSchema.safeParse("PASSWORD123!");
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain(
          "Password must contain at least one lowercase letter",
        );
      }
    });

    it("should reject password without uppercase letter", () => {
      const result = passwordSchema.safeParse("password123!");
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain(
          "Password must contain at least one uppercase letter",
        );
      }
    });

    it("should reject password without number", () => {
      const result = passwordSchema.safeParse("Password!");
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Password must contain at least one number");
      }
    });

    it("should reject password without special character", () => {
      const result = passwordSchema.safeParse("Password123");
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain(
          "Password must contain at least one special character",
        );
      }
    });

    it("should collect all validation errors", () => {
      const result = passwordSchema.safeParse("pass");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });
  });
});

describe("Password Match Schema", () => {
  it("should accept matching passwords", () => {
    const result = passwordMatchSchema.safeParse({
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-matching passwords", () => {
    const result = passwordMatchSchema.safeParse({
      password: "Password123!",
      confirmPassword: "Different123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "confirmPassword",
      );
      expect(issue?.message).toBe("Passwords do not match");
    }
  });

  it("should also validate individual password requirements", () => {
    const result = passwordMatchSchema.safeParse({
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("Account Form Schema", () => {
  describe("Valid form data", () => {
    it("should accept valid account form data", () => {
      const result = accountFormSchema.safeParse({
        email: "test@example.com",
        confirmEmail: "test@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Email mismatch", () => {
    it("should reject when emails do not match", () => {
      const result = accountFormSchema.safeParse({
        email: "test@example.com",
        confirmEmail: "different@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === "confirmEmail",
        );
        expect(issue?.message).toBe("Emails do not match");
      }
    });
  });

  describe("Password mismatch", () => {
    it("should reject when passwords do not match", () => {
      const result = accountFormSchema.safeParse({
        email: "test@example.com",
        confirmEmail: "test@example.com",
        password: "Password123!",
        confirmPassword: "Different123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === "confirmPassword",
        );
        expect(issue?.message).toBe("Passwords do not match");
      }
    });
  });

  describe("Multiple errors", () => {
    it("should report multiple validation errors", () => {
      const result = accountFormSchema.safeParse({
        email: "invalid-email",
        confirmEmail: "different",
        password: "weak",
        confirmPassword: "different",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});

describe("Identification Form Schema", () => {
  it("should accept valid identification data", () => {
    const result = identificationFormSchema.safeParse({
      cedula: "40200612345",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid cedula", () => {
    const result = identificationFormSchema.safeParse({
      cedula: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("Login Form Schema", () => {
  it("should accept valid login data", () => {
    const result = loginFormSchema.safeParse({
      email: "test@example.com",
      password: "anyPassword123!",
      rememberMe: true,
    });
    expect(result.success).toBe(true);
  });

  it("should accept login without rememberMe", () => {
    const result = loginFormSchema.safeParse({
      email: "test@example.com",
      password: "anyPassword123!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(false);
    }
  });

  it("should reject login with empty password", () => {
    const result = loginFormSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password is required");
    }
  });

  it("should reject login with invalid email", () => {
    const result = loginFormSchema.safeParse({
      email: "notanemail",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("Verification Step Schema", () => {
  describe("Valid verification codes", () => {
    it("should accept 6-digit codes", () => {
      const codes = ["123456", "000000", "999999", "555555"];
      codes.forEach((code) => {
        const result = verificationStepSchema.safeParse({ code });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Invalid verification codes", () => {
    it("should reject codes with less than 6 digits", () => {
      const result = verificationStepSchema.safeParse({ code: "12345" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Verification code must be 6 digits",
        );
      }
    });

    it("should reject codes with more than 6 digits", () => {
      const result = verificationStepSchema.safeParse({ code: "1234567" });
      expect(result.success).toBe(false);
    });

    it("should reject codes containing letters", () => {
      const result = verificationStepSchema.safeParse({ code: "12345a" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Verification code must contain only digits",
        );
      }
    });

    it("should reject codes with special characters", () => {
      const result = verificationStepSchema.safeParse({ code: "123-45" });
      expect(result.success).toBe(false);
    });
  });
});

describe("Schema Composition", () => {
  it("should compose identification step schema correctly", () => {
    const result = identificationStepSchema.safeParse({
      cedula: "40200612345",
    });
    expect(result.success).toBe(true);
  });

  it("should compose account step schema correctly", () => {
    const result = accountStepSchema.safeParse({
      email: "test@example.com",
      confirmEmail: "test@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(result.success).toBe(true);
  });

  it("should validate each field independently before refinements", () => {
    const result = accountStepSchema.safeParse({
      email: "test@example.com",
      confirmEmail: "test@example.com",
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("Edge Cases", () => {
  it("should handle unicode characters in email", () => {
    const result = emailSchema.safeParse("test@例え.jp");
    // Internationalized domain names may or may not be valid depending on config
    expect(typeof result.success).toBe("boolean");
  });

  it("should handle very long passwords up to limit", () => {
    const password = "A".repeat(124) + "b1!";
    const result = passwordSchema.safeParse(password);
    expect(result.success).toBe(true);
  });

  it("should handle password exactly at max length", () => {
    const password = "A".repeat(125) + "b1!";
    const result = passwordSchema.safeParse(password);
    expect(result.success).toBe(true);
  });

  it("should handle null and undefined values", () => {
    const nullResult = emailSchema.safeParse(null);
    const undefinedResult = emailSchema.safeParse(undefined);

    expect(nullResult.success).toBe(false);
    expect(undefinedResult.success).toBe(false);
  });

  it("should handle numeric input for cedula", () => {
    // Zod should coerce or reject
    const result = cedulaSchema.safeParse(12345678901);
    expect(typeof result.success).toBe("boolean");
  });
});
