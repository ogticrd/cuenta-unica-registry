import { describe, expect, it } from "vitest";

describe("security headers", () => {
  it("applies baseline browser hardening headers to every route", async () => {
    const { default: nextConfig, securityHeaders } = await import(
      "../../next.config.mjs"
    );
    const configuredHeaders = Object.fromEntries(
      securityHeaders.map(({ key, value }) => [key, value]),
    );

    expect(configuredHeaders).toMatchObject({
      "Content-Security-Policy": "frame-ancestors 'none'",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    expect(configuredHeaders["Permissions-Policy"]).toContain("camera=(self)");
    expect(configuredHeaders["Permissions-Policy"]).toContain("microphone=()");

    await expect(nextConfig.headers?.()).resolves.toEqual([
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]);
  });
});
