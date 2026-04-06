import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPasswordRequirementStatus,
  isBreachedPassword,
  isPasswordStrongEnough,
  PASSWORD_MIN_LENGTH,
} from "@/lib/utils/password";

function sha1ArrayBuffer(value: string) {
  const digest = createHash("sha1").update(value).digest();
  return digest.buffer.slice(
    digest.byteOffset,
    digest.byteOffset + digest.byteLength,
  );
}

describe("password utils", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports the production password requirements", () => {
    expect(getPasswordRequirementStatus("")).toEqual({
      lowercase: false,
      uppercase: false,
      number: false,
      symbol: false,
      length: false,
    });

    expect(getPasswordRequirementStatus("Password123!")).toEqual({
      lowercase: true,
      uppercase: true,
      number: true,
      symbol: true,
      length: true,
    });

    expect(PASSWORD_MIN_LENGTH).toBe(10);
  });

  it("evaluates password strength using the real implementation", () => {
    expect(isPasswordStrongEnough("Abcdefghij1!")).toBe(true);
    expect(isPasswordStrongEnough("abcdefghij1!")).toBe(false);
    expect(isPasswordStrongEnough("Abc1!")).toBe(false);
  });

  it("enforces the exact minimum length boundary", () => {
    expect(isPasswordStrongEnough("Abcdefg1!")).toBe(false);
    expect(isPasswordStrongEnough("Abcdefgh1!")).toBe(true);
  });

  it("short-circuits breach checks for weak passwords", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    await expect(isBreachedPassword("weak")).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("queries the HIBP range API using the SHA-1 prefix of the real password hash", async () => {
    const password = "StrongPass123!";
    const digestSpy = vi
      .spyOn(global.crypto.subtle, "digest")
      .mockResolvedValueOnce(sha1ArrayBuffer(password));
    const expectedPrefix = createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase()
      .slice(0, 5);
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("NOPE:1"),
    } as Response);

    await expect(isBreachedPassword(password)).resolves.toBe(false);

    expect(digestSpy.mock.calls[0]?.[0]).toBe("SHA-1");
    expect(ArrayBuffer.isView(digestSpy.mock.calls[0]?.[1] as ArrayBufferView)).toBe(
      true,
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      `https://api.pwnedpasswords.com/range/${expectedPrefix}`,
      {
        headers: {
          "Add-Padding": "true",
        },
      },
    );
  });

  it("returns true when the real suffix is present in the breach response", async () => {
    const password = "StrongPass123!";
    const fullHash = createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();
    const suffix = fullHash.slice(5);

    vi.spyOn(global.crypto.subtle, "digest").mockResolvedValueOnce(
      sha1ArrayBuffer(password),
    );
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(`${suffix}:42\nOTHER:1`),
    } as Response);

    await expect(isBreachedPassword(password)).resolves.toBe(true);
  });

  it("returns false when the breach API responds with a non-ok status", async () => {
    vi.spyOn(global.crypto.subtle, "digest").mockResolvedValueOnce(
      sha1ArrayBuffer("StrongPass123!"),
    );
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve(""),
    } as Response);

    await expect(isBreachedPassword("StrongPass123!")).resolves.toBe(false);
  });

  it("returns false when the breach API fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(global.crypto.subtle, "digest").mockResolvedValueOnce(
      sha1ArrayBuffer("StrongPass123!"),
    );
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

    await expect(isBreachedPassword("StrongPass123!")).resolves.toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
