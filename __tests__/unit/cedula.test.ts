import { beforeEach, describe, expect, it } from "vitest";
import {
  CEDULA_DIGITS_LENGTH,
  CEDULA_MASK_LENGTH,
  formatCedula,
  isValidCedula,
  normalizeCedula,
} from "@/lib/utils/cedula";

async function sha256Hex(value: string) {
  const encodedValue = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encodedValue);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

describe("cedula utils", () => {
  const INVALID_CHECKSUM_CEDULA = "12345678901";

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES;
  });

  it("normalizes cedulas by stripping non-digits and truncating to 11 digits", () => {
    expect(normalizeCedula("001-00200300-4")).toBe("00100200300");
    expect(normalizeCedula("123456789012345")).toBe("12345678901");
    expect(normalizeCedula("abc-def")).toBe("");
  });

  it("formats full and partial cedulas using the production formatter", () => {
    expect(formatCedula("12345678901")).toBe("123-4567890-1");
    expect(formatCedula("1234567890")).toBe("123-4567890");
    expect(formatCedula("123")).toBe("123");
    expect(formatCedula("")).toBe("");
  });

  it("accepts a valid cedula with or without punctuation", async () => {
    await expect(isValidCedula("40200612345")).resolves.toBe(true);
    await expect(isValidCedula("402-0061234-5")).resolves.toBe(true);
  });

  it("rejects invalid-length and invalid-checksum cedulas", async () => {
    await expect(isValidCedula("1234567890")).resolves.toBe(false);
    await expect(isValidCedula("12345678901")).resolves.toBe(false);
  });

  it("honors configured Luhn exceptions through the production hash path", async () => {
    process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES =
      await sha256Hex(INVALID_CHECKSUM_CEDULA);

    await expect(isValidCedula(INVALID_CHECKSUM_CEDULA)).resolves.toBe(true);
  });

  it("rejects cedulas when configured exception hashes do not match", async () => {
    process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES = "f".repeat(64);

    await expect(isValidCedula(INVALID_CHECKSUM_CEDULA)).resolves.toBe(false);
  });

  it("accepts matching exception hashes from a comma-separated env var with whitespace", async () => {
    const matchingHash = await sha256Hex(INVALID_CHECKSUM_CEDULA);
    process.env.NEXT_PUBLIC_LUHN_EXCEPTION_HASHES = `f${"0".repeat(63)}, ${matchingHash} ,${"a".repeat(64)}`;

    await expect(isValidCedula(INVALID_CHECKSUM_CEDULA)).resolves.toBe(true);
  });

  it("exports the production cedula constants", () => {
    expect(CEDULA_DIGITS_LENGTH).toBe(11);
    expect(CEDULA_MASK_LENGTH).toBe(13);
  });
});
