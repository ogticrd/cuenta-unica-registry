import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ory/nextjs/middleware", () => ({
  createOryMiddleware: () => vi.fn(() => new Response(null, { status: 204 })),
}));

import { proxy } from "@/proxy";

const ORY_SDK_URL = "https://ory.example.test";
const PUBLIC_ORIGIN = "https://cuenta-unica.example.test";

function createCloudRunRequest(pathname: string, cookie?: string) {
  return new NextRequest(`https://0.0.0.0:8080${pathname}`, {
    headers: {
      ...(cookie ? { cookie } : {}),
      host: "0.0.0.0:8080",
      "x-forwarded-host": "cuenta-unica.example.test",
      "x-forwarded-proto": "https",
    },
  });
}

describe("proxy", () => {
  beforeEach(() => {
    process.env.ORY_SDK_URL = ORY_SDK_URL;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ORY_SDK_URL;
  });

  it("checks Ory sessions against ORY_SDK_URL instead of the internal Cloud Run origin", async () => {
    await proxy(createCloudRunRequest("/login", "ory_session=session-123"));

    expect(fetch).toHaveBeenCalledWith(`${ORY_SDK_URL}/sessions/whoami`, {
      headers: {
        accept: "application/json",
        cookie: "ory_session=session-123",
      },
      cache: "no-store",
    });
  });

  it("redirects protected routes to the public forwarded origin", async () => {
    const response = await proxy(createCloudRunRequest("/dashboard"));

    expect(response.headers.get("location")).toBe(
      `${PUBLIC_ORIGIN}/self-service/login/browser`,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("redirects authenticated users away from auth routes using the public forwarded origin", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await proxy(
      createCloudRunRequest("/login", "ory_session=session-123"),
    );

    expect(response.headers.get("location")).toBe(`${PUBLIC_ORIGIN}/dashboard`);
  });
});
