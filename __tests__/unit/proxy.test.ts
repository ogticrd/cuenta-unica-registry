import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_CONTEXT_COOKIE,
  ANALYTICS_CONTEXT_LAUNCH_COOKIE,
  type AnalyticsContext,
  serializeAnalyticsContext,
} from "@/lib/analytics/context-core";
import {
  RECAPTCHA_PROOF_COOKIE,
  RECOVERY_RECAPTCHA_ACTION,
  serializeRecaptchaProof,
} from "@/lib/security/recaptcha-proof-core";

vi.mock("@ory/nextjs/middleware", async () => {
  const { NextResponse } = await import("next/server");

  return {
    createOryMiddleware: () =>
      vi.fn(() => new NextResponse(null, { status: 204 })),
  };
});

import { proxy } from "@/proxy";

const ORY_SDK_URL = "https://ory.example.test";
const PUBLIC_ORIGIN = "https://cuenta-unica.example.test";
const ANALYTICS_SECRET = "proxy-analytics-secret";
const PRIVATE_PAGES = [
  "/dashboard",
  "/profile",
  "/history",
  "/notifications",
  "/support",
  "/about",
  "/settings",
  "/settings?flow=settings-123",
  "/consent?consent_challenge=consent-123",
];

function createCloudRunRequest(
  pathname: string,
  cookie?: string,
  method = "GET",
) {
  return new NextRequest(`https://0.0.0.0:8080${pathname}`, {
    method,
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
    vi.stubEnv("ANALYTICS_CONTEXT_SECRET", undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
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
      redirect: "manual",
    });
  });

  it.each(PRIVATE_PAGES)("redirects anonymous requests to %s", async (path) => {
    const response = await proxy(createCloudRunRequest(path));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${PUBLIC_ORIGIN}/login`);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(
    PRIVATE_PAGES,
  )("allows a valid Ory session to open %s", async (path) => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await proxy(
      createCloudRunRequest(path, "ory_session=session-123"),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    401, 302,
  ])("requires a valid session when Ory responds %i", async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status }));

    const response = await proxy(
      createCloudRunRequest("/notifications", "ory_session=stale-session"),
    );

    expect(response.headers.get("location")).toBe(`${PUBLIC_ORIGIN}/login`);
  });

  it("enforces authentication before using the settings analytics response", async () => {
    process.env.REGISTRATION_SESSION_SECRET = ANALYTICS_SECRET;
    const path = "/settings?flow=settings-123";
    const anonymous = await proxy(createCloudRunRequest(path));

    expect(anonymous.headers.get("location")).toBe(`${PUBLIC_ORIGIN}/login`);

    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const authenticated = await proxy(
      createCloudRunRequest(path, "ory_session=session-123"),
    );

    expect(authenticated.headers.get("x-middleware-next")).toBe("1");
    expect(
      authenticated.cookies.get(ANALYTICS_CONTEXT_COOKIE)?.value,
    ).toBeTruthy();
  });

  it("delegates the settings flow entry point to Ory", async () => {
    const response = await proxy(
      createCloudRunRequest("/self-service/settings/browser"),
    );

    expect(response.status).toBe(204);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    "/faq",
    "/terms",
    "/about-us",
  ])("allows public requests to %s", async (path) => {
    const response = await proxy(createCloudRunRequest(path));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    "/login",
    "/register",
    "/register/email-sent",
    "/recovery",
    "/verification",
    "/login?return_to=%2Fdashboard",
    "/login?flow=",
    "/register?flow=signup-123",
    "/recovery?login_challenge=login-123",
  ])("redirects signed-in users away from %s before refreshing analytics", async (path) => {
    process.env.REGISTRATION_SESSION_SECRET = ANALYTICS_SECRET;
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await proxy(
      createCloudRunRequest(path, "ory_session=session-123"),
    );

    expect(response.headers.get("location")).toBe(`${PUBLIC_ORIGIN}/dashboard`);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("keeps analytics initialization for signed-out visitors on auth pages", async () => {
    process.env.REGISTRATION_SESSION_SECRET = ANALYTICS_SECRET;
    const response = await proxy(createCloudRunRequest("/register"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.cookies.get(ANALYTICS_CONTEXT_COOKIE)?.value).toBeTruthy();
  });

  it("still redirects signed-in users when the analytics launch cookie matches", async () => {
    process.env.REGISTRATION_SESSION_SECRET = ANALYTICS_SECRET;
    const cookie = await createAnalyticsCookie({
      journeyId: "journey-launch",
      clientId: "__unlinked__",
      linkageStatus: "unlinked",
      entryPath: "/login",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await proxy(
      createCloudRunRequest(
        "/login",
        `ory_session=session-123; ${cookie}; ${ANALYTICS_CONTEXT_LAUNCH_COOKIE}=/login`,
      ),
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

  it.each([
    "/login?flow=flow-123",
    "/login?login_challenge=challenge-123",
    "/login?refresh=true",
    "/login?aal=aal2",
    "/recovery?flow=recovery-123",
    "/verification?flow=verification-123",
    "/register/email-sent?flow=verification-123",
  ])("lets Ory handle %s with an authenticated session", async (path) => {
    process.env.REGISTRATION_SESSION_SECRET = ANALYTICS_SECRET;
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await proxy(
      createCloudRunRequest(path, "ory_session=session-123"),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("blocks Ory recovery submissions without a reCAPTCHA proof", async () => {
    process.env.REGISTRATION_SESSION_SECRET = "recaptcha-secret";

    const response = await proxy(
      createCloudRunRequest(
        "/.ory/self-service/recovery?flow=flow-123",
        undefined,
        "POST",
      ),
    );

    expect(response.status).toBe(403);
  });

  it("forwards Ory recovery submissions with a valid single-use proof", async () => {
    process.env.REGISTRATION_SESSION_SECRET = "recaptcha-secret";
    const proof = await serializeRecaptchaProof(
      RECOVERY_RECAPTCHA_ACTION,
      "recaptcha-secret",
    );

    const response = await proxy(
      createCloudRunRequest(
        "/.ory/self-service/recovery?flow=flow-123",
        `${RECAPTCHA_PROOF_COOKIE}=${proof}`,
        "POST",
      ),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain(
      `${RECAPTCHA_PROOF_COOKIE}=`,
    );
  });
});
