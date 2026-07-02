import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_CONTEXT_COOKIE,
  type AnalyticsContext,
  serializeAnalyticsContext,
} from "@/lib/analytics/context-core";

vi.mock("@ory/nextjs/middleware", () => ({
  createOryMiddleware: () => vi.fn(() => new Response(null, { status: 204 })),
}));

import { proxy } from "@/proxy";

const ORY_SDK_URL = "https://ory.example.test";
const PUBLIC_ORIGIN = "https://cuenta-unica.example.test";
const ANALYTICS_SECRET = "proxy-analytics-secret";

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

async function createAnalyticsCookie(context: AnalyticsContext) {
  return `${ANALYTICS_CONTEXT_COOKIE}=${await serializeAnalyticsContext(
    context,
    ANALYTICS_SECRET,
  )}`;
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
    delete process.env.REGISTRATION_SESSION_SECRET;
    delete process.env.ANALYTICS_ALLOW_DIRECT_CLIENT_ID;
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

    expect(response.headers.get("location")).toBe(`${PUBLIC_ORIGIN}/login`);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("redirects authenticated users away from auth routes using the public forwarded origin", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await proxy(
      createCloudRunRequest("/login", "ory_session=session-123"),
    );

    expect(response.headers.get("location")).toBe(`${PUBLIC_ORIGIN}/dashboard`);
  });

  it("preserves an existing linked analytics context on auth screens without a new client launch", async () => {
    process.env.REGISTRATION_SESSION_SECRET = ANALYTICS_SECRET;
    const cookie = await createAnalyticsCookie({
      journeyId: "journey-123",
      clientId: "4c2d8cc9-1740-47a5-8a32-e94c7049edff",
      linkageStatus: "linked",
      entryPath: "/register",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      returnUrl: "http://localhost:5173/callback",
    });

    const response = await proxy(createCloudRunRequest("/login", cookie));

    expect(response.headers.get("set-cookie") ?? "").not.toContain(
      ANALYTICS_CONTEXT_COOKIE,
    );
  });

  it("lets authenticated Ory flow requests finish instead of redirecting to dashboard", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await proxy(
      createCloudRunRequest("/login?flow=flow-123", "ory_session=session-123"),
    );

    expect(response.headers.get("location")).toBeNull();
  });
});
