import { describe, expect, it } from "vitest";
import {
  getRequestOrigin,
  getSafeReturnUrl,
  isValidReturnUrl,
  parseAllowedReturnOrigins,
} from "@/lib/utils/return-url";

describe("isValidReturnUrl", () => {
  it("accepts a valid HTTPS URL", () => {
    expect(isValidReturnUrl("https://example.com")).toBe(true);
  });

  it("accepts a valid HTTP URL", () => {
    expect(isValidReturnUrl("http://localhost:3000")).toBe(true);
  });

  it("accepts HTTPS URLs with paths and query parameters", () => {
    expect(isValidReturnUrl("https://example.com/dashboard?foo=bar")).toBe(
      true,
    );
  });

  it("rejects javascript: protocol", () => {
    expect(isValidReturnUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: protocol", () => {
    expect(isValidReturnUrl("data:text/html,<h1>Evil</h1>")).toBe(false);
  });

  it("rejects ftp: protocol", () => {
    expect(isValidReturnUrl("ftp://files.example.com")).toBe(false);
  });

  it("rejects relative paths", () => {
    expect(isValidReturnUrl("/dashboard")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidReturnUrl("")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isValidReturnUrl("not-a-url")).toBe(false);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isValidReturnUrl("//example.com")).toBe(false);
  });

  it("accepts HTTP URL with port", () => {
    expect(isValidReturnUrl("http://127.0.0.1:8080/callback")).toBe(true);
  });

  it("rejects file: protocol", () => {
    expect(isValidReturnUrl("file:///etc/passwd")).toBe(false);
  });
});

describe("getSafeReturnUrl", () => {
  it("accepts same-origin absolute URLs", () => {
    expect(
      getSafeReturnUrl("https://cuentaunica.gob.do/dashboard?tab=home", {
        currentOrigin: "https://cuentaunica.gob.do",
      }),
    ).toBe("https://cuentaunica.gob.do/dashboard?tab=home");
  });

  it("accepts allowlisted external origins", () => {
    expect(
      getSafeReturnUrl("https://services.gob.do/callback", {
        currentOrigin: "https://cuentaunica.gob.do",
        allowedOrigins: ["https://services.gob.do"],
      }),
    ).toBe("https://services.gob.do/callback");
  });

  it("rejects external origins that are not allowlisted", () => {
    expect(
      getSafeReturnUrl("https://attacker.example/phishing", {
        currentOrigin: "https://cuentaunica.gob.do",
        allowedOrigins: ["https://services.gob.do"],
      }),
    ).toBeUndefined();
  });

  it("rejects non-http protocols", () => {
    expect(
      getSafeReturnUrl("javascript:alert(1)", {
        currentOrigin: "https://cuentaunica.gob.do",
      }),
    ).toBeUndefined();
  });

  it("rejects malformed URLs", () => {
    expect(
      getSafeReturnUrl("not-a-url", {
        currentOrigin: "https://cuentaunica.gob.do",
      }),
    ).toBeUndefined();
  });
});

describe("getRequestOrigin", () => {
  it("uses the request URL when proxy headers are absent", () => {
    expect(
      getRequestOrigin(new Headers(), "http://localhost:3000/register"),
    ).toBe("http://localhost:3000");
  });

  it("uses forwarded protocol and host when present", () => {
    expect(
      getRequestOrigin(
        new Headers({
          "x-forwarded-proto": "https",
          "x-forwarded-host": "cuentaunica.gob.do",
        }),
        "http://internal:3000/register",
      ),
    ).toBe("https://cuentaunica.gob.do");
  });

  it("uses the first forwarded value from comma-separated proxy chains", () => {
    expect(
      getRequestOrigin(
        new Headers({
          "x-forwarded-proto": "https, http",
          "x-forwarded-host": "cuentaunica.gob.do, internal:3000",
        }),
        "http://internal:3000/register",
      ),
    ).toBe("https://cuentaunica.gob.do");
  });
});

describe("parseAllowedReturnOrigins", () => {
  it("parses comma separated origins", () => {
    expect(
      parseAllowedReturnOrigins(
        "https://services.gob.do, https://portal.gob.do ",
      ),
    ).toEqual(["https://services.gob.do", "https://portal.gob.do"]);
  });

  it("returns an empty list when unset", () => {
    expect(parseAllowedReturnOrigins(undefined)).toEqual([]);
  });
});
