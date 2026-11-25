import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@ory/nextjs/middleware", async () => {
  const { createRequire } = await import("node:module");
  // Node's ESM loader cannot resolve the SDK's extensionless next/server import.
  return createRequire(import.meta.url)("@ory/nextjs/middleware");
});

describe("Ory proxy trusted origins", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("serves the landing page without a deployed origin list", async () => {
    vi.stubEnv("ORY_TRUSTED_ORIGINS", undefined);
    const { proxy } = await import("@/proxy");

    const response = await proxy(new NextRequest("http://localhost:3000/"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("passes only configured origins to Ory for URL rewriting", async () => {
    const trustedOrigin = "https://registry.example.test";
    const alternateOrigin = "https://registry-alt.example.test";
    const oryOrigin = "https://ory.example.test";
    vi.stubEnv("ORY_TRUSTED_ORIGINS", `${trustedOrigin}, ${alternateOrigin}`);
    vi.stubEnv("ORY_SDK_URL", oryOrigin);
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      return new Response(null, { status: 401 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { proxy } = await import("@/proxy");

    for (const origin of [trustedOrigin, alternateOrigin, oryOrigin]) {
      await proxy(new NextRequest(`${origin}/sessions/whoami`));
    }

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(
      Array(3).fill(`${oryOrigin}/sessions/whoami`),
    );
    expect(
      fetchMock.mock.calls.map(([, options]) =>
        new Headers(options?.headers).get("Ory-Base-URL-Rewrite"),
      ),
    ).toEqual([trustedOrigin, alternateOrigin, null]);
  });
});
