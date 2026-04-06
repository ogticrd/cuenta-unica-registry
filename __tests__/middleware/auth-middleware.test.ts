import { describe, expect, it, vi } from "vitest";

const { mockOryMiddleware, mockCreateOryMiddleware, mockOryConfig } =
  vi.hoisted(() => {
    const oryMiddleware = vi.fn();

    return {
      mockOryMiddleware: oryMiddleware,
      mockCreateOryMiddleware: vi.fn(() => oryMiddleware),
      mockOryConfig: { mocked: true },
    };
  });

vi.mock("@ory/nextjs/middleware", () => ({
  createOryMiddleware: mockCreateOryMiddleware,
}));

vi.mock("@/ory.config", () => ({
  default: mockOryConfig,
}));

import { config, proxy } from "@/proxy";

describe("proxy", () => {
  it("creates the Ory middleware with the real exported config", () => {
    expect(mockCreateOryMiddleware).toHaveBeenCalledWith(mockOryConfig);
  });

  it("delegates incoming requests to the created Ory middleware", () => {
    const request = { nextUrl: { pathname: "/ui/login" } };
    mockOryMiddleware.mockReturnValueOnce("middleware-result");

    const result = proxy(request as never);

    expect(mockOryMiddleware).toHaveBeenCalledWith(request);
    expect(result).toBe("middleware-result");
  });

  it("returns async middleware results unchanged", async () => {
    const request = { nextUrl: { pathname: "/self-service/login/browser" } };
    mockOryMiddleware.mockResolvedValueOnce("async-middleware-result");

    await expect(proxy(request as never)).resolves.toBe("async-middleware-result");
    expect(mockOryMiddleware).toHaveBeenCalledWith(request);
  });

  it("exports the expected matcher list", () => {
    expect(config.matcher).toEqual([
      "/self-service/:path*",
      "/sessions/whoami",
      "/ui/:path*",
      "/.well-known/ory/:path*",
      "/.ory/:path*",
    ]);
  });
});
