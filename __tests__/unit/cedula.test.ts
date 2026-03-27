import { describe, it, expect, beforeEach } from "vitest";

// Cedula utility functions (copied from project)
const CEDULA_DIGITS_LENGTH = 11;
const CEDULA_MASK_LENGTH = 13;

function normalizeCedula(value: string) {
  return value.replace(/\D/g, "").slice(0, CEDULA_DIGITS_LENGTH);
}

function formatCedula(value: string) {
  const digits = normalizeCedula(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

function checkLuhn(cedula: string) {
  const digits = normalizeCedula(cedula);

  if (digits.length !== CEDULA_DIGITS_LENGTH) {
    return false;
  }

  const reversedDigits = digits
    .split("")
    .reverse()
    .map((digit) => Number.parseInt(digit, 10));

  const checkDigit = reversedDigits.shift();

  if (checkDigit === undefined) {
    return false;
  }

  const sum = reversedDigits.reduce((accumulator, digit, index) => {
    if (index % 2 !== 0) {
      return accumulator + digit;
    }

    const doubledDigit = digit * 2;
    return accumulator + (doubledDigit > 9 ? doubledDigit - 9 : doubledDigit);
  }, checkDigit);

  return sum % 10 === 0;
}

async function sha256(value: string) {
  const encodedValue = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encodedValue);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function isLuhnException(cedula: string) {
  const hashes = process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES;

  if (!hashes) {
    return false;
  }

  const hashList = hashes.split(",").map((hash) => hash.trim().toLowerCase());
  const cedulaHash = await sha256(normalizeCedula(cedula));

  return hashList.includes(cedulaHash);
}

async function isValidCedula(cedula: string) {
  const normalizedCedula = normalizeCedula(cedula);

  if (normalizedCedula.length !== CEDULA_DIGITS_LENGTH) {
    return false;
  }

  if (checkLuhn(normalizedCedula)) {
    return true;
  }

  return isLuhnException(normalizedCedula);
}

describe("normalizeCedula", () => {
  it("should remove all non-digit characters", () => {
    expect(normalizeCedula("123-456-7890-1")).toBe("12345678901");
    expect(normalizeCedula("abc123def456")).toBe("123456");
    // 11 digits exactly
    expect(normalizeCedula("001-00200300-4")).toBe("00100200300"); // 12 chars -> 11 digits
  });

  it("should truncate to 11 digits max", () => {
    expect(normalizeCedula("123456789012345")).toBe("12345678901");
    expect(normalizeCedula("12345678901")).toBe("12345678901");
  });

  it("should handle empty string", () => {
    expect(normalizeCedula("")).toBe("");
  });

  it("should handle string with only non-digits", () => {
    expect(normalizeCedula("abc-def-ghi")).toBe("");
  });

  it("should preserve leading zeros", () => {
    // These have exactly 11 digits
    expect(normalizeCedula("001-002-00304")).toBe("00100200304");
    expect(normalizeCedula("00000000000")).toBe("00000000000");
  });
});

describe("formatCedula", () => {
  it("should format cedula with full mask (XXX-XXXXXXX-X)", () => {
    expect(formatCedula("12345678901")).toBe("123-4567890-1");
    expect(formatCedula("00100200304")).toBe("001-0020030-4");
  });

  it("should format partial cedulas correctly", () => {
    expect(formatCedula("123")).toBe("123");
    expect(formatCedula("1234")).toBe("123-4");
    expect(formatCedula("1234567890")).toBe("123-4567890");
  });

  it("should handle already formatted cedulas", () => {
    expect(formatCedula("123-4567890-1")).toBe("123-4567890-1");
  });

  it("should handle empty string", () => {
    expect(formatCedula("")).toBe("");
  });

  it("should handle cedula with extra characters", () => {
    expect(formatCedula("123-abc-4567890-1-xyz")).toBe("123-4567890-1");
  });

  it("should preserve leading zeros in formatting", () => {
    expect(formatCedula("00100200304")).toBe("001-0020030-4");
    expect(formatCedula("00000000000")).toBe("000-0000000-0");
  });
});

describe("checkLuhn", () => {
  it("should return false for cedulas with less than 11 digits", () => {
    expect(checkLuhn("1234567890")).toBe(false);
    expect(checkLuhn("123")).toBe(false);
  });

  it("should return false for cedulas with more than 11 digits", () => {
    expect(checkLuhn("123456789012")).toBe(false);
  });

  it("should validate correct Luhn numbers", () => {
    // These are test cedulas that pass Luhn algorithm
    // Luhn valid: the sum of digits with the algorithm should be divisible by 10
    // Let's compute a valid one:
    // Starting with 4020123456 and computing check digit
    // Or use known valid ones
    expect(checkLuhn("40200612345")).toBe(true); // This passes Luhn
    expect(checkLuhn("22300012345")).toBe(true); // This passes Luhn
  });

  it("should return false for invalid Luhn numbers", () => {
    // 00000000000: sum = 0, which IS divisible by 10
    // So it actually passes the Luhn check!
    // Let's use numbers that definitely fail
    expect(checkLuhn("00000000001")).toBe(false); // Last digit makes it fail
    expect(checkLuhn("12345678901")).toBe(false); // Random number
  });

  it("should handle formatted cedulas", () => {
    expect(checkLuhn("402-0061234-5")).toBe(true);
    expect(checkLuhn("223-0001234-5")).toBe(true);
  });
});

describe("isValidCedula", () => {
  beforeEach(() => {
    // Clear any environment variables
    delete process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES;
  });

  it("should return false for cedulas with less than 11 digits", async () => {
    expect(await isValidCedula("1234567890")).toBe(false);
    expect(await isValidCedula("123")).toBe(false);
  });

  it("should return true for valid Luhn cedulas", async () => {
    expect(await isValidCedula("40200612345")).toBe(true);
    expect(await isValidCedula("22300012345")).toBe(true);
  });

  it("should return false for invalid cedulas", async () => {
    expect(await isValidCedula("00000000001")).toBe(false);
    expect(await isValidCedula("12345678901")).toBe(false);
  });

  it("should handle formatted cedulas", async () => {
    expect(await isValidCedula("402-0061234-5")).toBe(true);
    expect(await isValidCedula("223-0001234-5")).toBe(true);
  });

  it("should check Luhn exceptions when configured", async () => {
    // Set a non-matching hash - this cedula won't match any hash
    process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES = "some-hash-that-wont-match";
    // 00000000001 fails Luhn
    expect(await isValidCedula("00000000001")).toBe(false);
    // Clean up
    delete process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES;
  });
});

describe("Cedula Edge Cases", () => {
  it("should handle special characters", () => {
    expect(normalizeCedula("!@#$%^&*()")).toBe("");
    expect(normalizeCedula("123!@#456$%^789")).toBe("123456789");
  });

  it("should handle whitespace", () => {
    expect(normalizeCedula("123 456 789")).toBe("123456789");
    expect(normalizeCedula("   12345678901   ")).toBe("12345678901");
  });

  it("should handle unicode characters", () => {
    expect(normalizeCedula("123áéíóú456")).toBe("123456");
    // Full-width digits are not ASCII digits
    expect(normalizeCedula("１２３４５６")).toBe("");
  });

  it("should handle mixed formats", () => {
    // "001-abc-00200300-4!@#" has 12 digit characters, truncated to 11
    const input = "001-abc-00200300-4!@#";
    expect(normalizeCedula(input)).toBe("00100200300");
  });
});

describe("Cedula Constants", () => {
  it("should have correct constant values", () => {
    expect(CEDULA_DIGITS_LENGTH).toBe(11);
    expect(CEDULA_MASK_LENGTH).toBe(13); // 3 + 1 + 7 + 1 + 1 = 13 (with dashes)
  });
});

describe("formatCedula and normalizeCedula integration", () => {
  it("should be reversible for valid cedulas", () => {
    const original = "40200612345";
    const formatted = formatCedula(original);
    const normalized = normalizeCedula(formatted);
    expect(normalized).toBe(original);
  });

  it("should handle round-trip formatting", () => {
    const testCases = ["12345678901", "00100200304", "40200612345"];
    testCases.forEach((cedula) => {
      const formatted = formatCedula(cedula);
      const normalized = normalizeCedula(formatted);
      expect(normalized).toBe(cedula);
    });
  });
});
