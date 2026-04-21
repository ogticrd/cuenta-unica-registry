import { describe, expect, it, vi } from "vitest";
import {
  extractSetCookieHeaders,
  getServerCookies,
  mergeCookieHeaders,
} from "@/lib/ory/cookies";

const mockHeadersGet = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: (...args: unknown[]) => mockHeadersGet(...args),
    }),
  ),
}));

describe("extractSetCookieHeaders", () => {
  it("returns an array when set-cookie is already an array", () => {
    const result = extractSetCookieHeaders({
      headers: { "set-cookie": ["a=1", "b=2"] },
    });

    expect(result).toEqual(["a=1", "b=2"]);
  });

  it("wraps a single set-cookie string in an array", () => {
    const result = extractSetCookieHeaders({
      headers: { "set-cookie": "a=1" },
    });

    expect(result).toEqual(["a=1"]);
  });

  it("returns an empty array when set-cookie header is missing", () => {
    const result = extractSetCookieHeaders({ headers: {} });

    expect(result).toEqual([]);
  });

  it("returns an empty array when set-cookie is undefined", () => {
    const result = extractSetCookieHeaders({
      headers: { "set-cookie": undefined },
    });

    expect(result).toEqual([]);
  });
});

describe("mergeCookieHeaders", () => {
  it("preserves base cookies when there are no set-cookie headers", () => {
    const result = mergeCookieHeaders("a=1; b=2", []);

    expect(result).toBe("a=1; b=2");
  });

  it("overwrites existing cookies from set-cookie headers", () => {
    const result = mergeCookieHeaders("a=1; b=2", ["b=new_value; Path=/"]);

    expect(result).toContain("b=new_value");
    expect(result).toContain("a=1");
    expect(result).not.toContain("b=2");
  });

  it("adds new cookies from set-cookie headers", () => {
    const result = mergeCookieHeaders("a=1", ["c=3; Path=/; HttpOnly"]);

    expect(result).toContain("a=1");
    expect(result).toContain("c=3");
  });

  it("handles empty base cookie header", () => {
    const result = mergeCookieHeaders("", ["a=1; Path=/"]);

    expect(result).toBe("a=1");
  });

  it("handles complex set-cookie strings with attributes", () => {
    const result = mergeCookieHeaders("session=old", [
      "session=new_token; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600",
    ]);

    expect(result).toBe("session=new_token");
  });

  it("merges multiple set-cookie headers", () => {
    const result = mergeCookieHeaders("a=1", ["b=2; Path=/", "c=3; Path=/"]);

    expect(result).toContain("a=1");
    expect(result).toContain("b=2");
    expect(result).toContain("c=3");
  });

  it("handles cookies with = in the value", () => {
    const result = mergeCookieHeaders("token=abc=def", []);

    expect(result).toBe("token=abc=def");
  });

  it("skips segments without an = separator", () => {
    const result = mergeCookieHeaders("invalid_segment; a=1", []);

    expect(result).toBe("a=1");
  });

  it("trims whitespace around cookie names and values", () => {
    const result = mergeCookieHeaders("  a  =  1  ;  b  =  2  ", []);

    expect(result).toContain("a=1");
    expect(result).toContain("b=2");
  });

  it("skips set-cookie entries with no name=value pair", () => {
    const result = mergeCookieHeaders("a=1", ["", "   "]);

    expect(result).toBe("a=1");
  });

  it("skips empty segments in base cookie header", () => {
    const result = mergeCookieHeaders("a=1;;b=2", []);
    expect(result).toBe("a=1; b=2");
  });

  it("skips base segments without = separator", () => {
    const result = mergeCookieHeaders("a=1;no_equals;b=2", []);
    expect(result).toBe("a=1; b=2");
  });

  it("skips set-cookie entries without = separator", () => {
    const result = mergeCookieHeaders("a=1", ["no_equals; Path=/"]);
    expect(result).toBe("a=1");
  });

  it("skips set-cookie entries with empty name", () => {
    const result = mergeCookieHeaders("a=1", ["=value; Path=/"]);
    expect(result).toBe("a=1");
  });
});

describe("getServerCookies", () => {
  it("returns the cookie header when present", async () => {
    mockHeadersGet.mockReturnValue("session=abc123; user=john");
    const result = await getServerCookies();
    expect(result).toBe("session=abc123; user=john");
  });

  it("returns empty string when cookie header is missing", async () => {
    mockHeadersGet.mockReturnValue(null);
    const result = await getServerCookies();
    expect(result).toBe("");
  });
});