import { createOryMiddleware } from "@ory/nextjs/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { normalizeClientId } from "@/lib/analytics/catalog";
import {
  ANALYTICS_CONTEXT_COOKIE,
  ANALYTICS_CONTEXT_LAUNCH_COOKIE,
  buildAnalyticsContextFromUrl,
  parseAnalyticsContext,
  serializeAnalyticsContext,
  shouldRefreshAnalyticsContext,
} from "@/lib/analytics/context-core";
import { logger } from "@/lib/logging/logger";
import {
  RECAPTCHA_PROOF_COOKIE,
  RECOVERY_RECAPTCHA_ACTION,
  validateRecaptchaProof,
} from "@/lib/security/recaptcha-proof-core";
import oryConfig from "@/ory.config";
import { ROUTES } from "./lib/constants/routes";

const trustedOrigins = (process.env.ORY_TRUSTED_ORIGINS ?? "")
  .split(/\s+/)
  .filter(Boolean);

const oryMiddleware = createOryMiddleware({
  ...oryConfig,
  trustedOrigins: trustedOrigins.length
    ? trustedOrigins
    : ["http://localhost:3000"],
});

const PROTECTED_ROUTES = [
  ROUTES.dashboard,
  ROUTES.profile,
  ROUTES.settingsPage,
  ROUTES.history,
  ROUTES.notifications,
  ROUTES.support,
  ROUTES.about,
  ROUTES.consent,
];

const AUTH_ROUTES = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.emailSent,
  ROUTES.recovery,
  ROUTES.verification,
];

const AUTH_ENTRY_PATHS = new Set([
  "/login",
  "/register",
  "/recovery",
  "/verification",
  ROUTES.settingsPage,
]);

function getAnalyticsSecret() {
  return (
    process.env.ANALYTICS_CONTEXT_SECRET ||
    process.env.REGISTRATION_SESSION_SECRET
  );
}

function allowDirectAnalyticsClientId() {
  return process.env.ANALYTICS_ALLOW_DIRECT_CLIENT_ID === "true";
}

async function readAnalyticsContextFromRequest(request: NextRequest) {
  const rawValue = request.cookies.get(ANALYTICS_CONTEXT_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  const secret = getAnalyticsSecret();
  if (!secret) {
    return null;
  }

  const parsed = await parseAnalyticsContext(rawValue, secret);
  if (!parsed || parsed.expiresAt < Date.now()) {
    return null;
  }

  return parsed;
}

async function maybeRefreshAnalyticsContext(request: NextRequest) {
  if (!AUTH_ENTRY_PATHS.has(request.nextUrl.pathname)) {
    return null;
  }

  const currentContext = await readAnalyticsContextFromRequest(request);
  const launchPath = request.cookies.get(
    ANALYTICS_CONTEXT_LAUNCH_COOKIE,
  )?.value;
  const requestedClientId = request.nextUrl.searchParams
    .get("client_id")
    ?.trim();
  const allowDirectClientId = allowDirectAnalyticsClientId();
  const hasExplicitClientContext =
    allowDirectClientId && Boolean(requestedClientId);

  if (currentContext && launchPath === request.nextUrl.pathname) {
    const response = NextResponse.next();
    response.cookies.delete(ANALYTICS_CONTEXT_LAUNCH_COOKIE);
    return response;
  }

  if (currentContext?.linkageStatus === "linked" && !hasExplicitClientContext) {
    return null;
  }

  const nextContext = allowDirectClientId
    ? buildAnalyticsContextFromUrl(request.nextUrl, {
        client: {
          clientId: normalizeClientId(
            request.nextUrl.searchParams.get("client_id"),
          ),
        },
      })
    : buildAnalyticsContextFromUrl(request.nextUrl);

  if (!shouldRefreshAnalyticsContext(currentContext, nextContext)) {
    return null;
  }

  const secret = getAnalyticsSecret();
  if (!secret) {
    return null;
  }

  const response = NextResponse.next();
  response.cookies.set({
    name: ANALYTICS_CONTEXT_COOKIE,
    value: await serializeAnalyticsContext(nextContext, secret),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}

function isOryFlowRequest({ pathname, searchParams }: NextRequest["nextUrl"]) {
  const hasFlow = Boolean(searchParams.get("flow")?.trim());

  if (pathname === ROUTES.login) {
    return (
      hasFlow ||
      Boolean(searchParams.get("login_challenge")?.trim()) ||
      searchParams.get("refresh") === "true" ||
      searchParams.get("aal") === "aal2"
    );
  }

  return (
    hasFlow &&
    (pathname === ROUTES.recovery ||
      pathname === ROUTES.verification ||
      pathname === ROUTES.emailSent)
  );
}

function getOrySessionUrl() {
  const baseUrl = process.env.ORY_SDK_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("Missing ORY_SDK_URL environment variable");
  }

  return `${baseUrl}/sessions/whoami`;
}

function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

function getRequestOrigin(request: NextRequest) {
  const host =
    getFirstHeaderValue(request.headers.get("x-forwarded-host")) ??
    getFirstHeaderValue(request.headers.get("host")) ??
    request.nextUrl.host;

  const protocol =
    getFirstHeaderValue(request.headers.get("x-forwarded-proto")) ??
    request.nextUrl.protocol.replace(/:$/, "") ??
    "https";

  return `${protocol}://${host}`;
}

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, getRequestOrigin(request)));
}

async function hasOrySession(request: NextRequest) {
  const cookie = request.headers.get("cookie") ?? "";

  if (!cookie) {
    return false;
  }

  const resp = await fetch(getOrySessionUrl(), {
    headers: {
      accept: "application/json",
      cookie,
    },
    cache: "no-store",
    redirect: "manual",
  });

  return resp.ok;
}

function isRecoverySubmission(request: NextRequest) {
  return (
    request.method === "POST" &&
    request.nextUrl.pathname.endsWith("/self-service/recovery")
  );
}

async function proxyRecoverySubmission(request: NextRequest) {
  const secret = process.env.REGISTRATION_SESSION_SECRET;
  const proof = request.cookies.get(RECAPTCHA_PROOF_COOKIE)?.value;
  const isValid =
    !!secret &&
    (await validateRecaptchaProof(proof, RECOVERY_RECAPTCHA_ACTION, secret));

  if (!isValid) {
    return NextResponse.json(
      { success: false, code: "recaptcha_failed" },
      { status: 403 },
    );
  }

  const response = await oryMiddleware(request);
  response.cookies.delete(RECAPTCHA_PROOF_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/.ory") ||
    path.startsWith("/self-service") ||
    path.startsWith("/ui") ||
    path.startsWith("/sessions") ||
    path.startsWith("/.well-known/ory")
  ) {
    if (isRecoverySubmission(request)) {
      return proxyRecoverySubmission(request);
    }

    return oryMiddleware(request);
  }

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
  const isLandingRoute = path === "/";

  if (isProtectedRoute || isAuthRoute || isLandingRoute) {
    let isAuthenticated = false;

    try {
      isAuthenticated = await hasOrySession(request);
    } catch (error) {
      logger.error(
        "Error checking Ory session in proxy:",
        { operation: "proxy" },
        error,
      );
    }

    if (isProtectedRoute && !isAuthenticated) {
      return redirectTo(request, ROUTES.login);
    }

    if (isAuthRoute && isAuthenticated && !isOryFlowRequest(request.nextUrl)) {
      return redirectTo(request, ROUTES.dashboard);
    }

    if (isLandingRoute && isAuthenticated) {
      return redirectTo(request, ROUTES.dashboard);
    }
  }

  return (await maybeRefreshAnalyticsContext(request)) ?? NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
