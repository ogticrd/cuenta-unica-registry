import { createOryMiddleware } from "@ory/nextjs/middleware";
import { type NextRequest, NextResponse } from "next/server";

import {
  ANALYTICS_CONTEXT_COOKIE,
  buildAnalyticsContextFromUrl,
  parseAnalyticsContext,
  serializeAnalyticsContext,
  shouldRefreshAnalyticsContext,
} from "@/lib/analytics/context-core";
import oryConfig from "@/ory.config";
import { ROUTES } from "./lib/constants/routes";

const oryMiddleware = createOryMiddleware(oryConfig);

const PROTECTED_ROUTES = [
  ROUTES.dashboard,
  ROUTES.profile,
  ROUTES.settings,
  ROUTES.history,
];

const AUTH_ROUTES = [
  "/login",
  ROUTES.register,
  ROUTES.emailSent,
  "/recovery",
  "/verification",
];

const AUTH_ENTRY_PATHS = new Set([
  "/login",
  "/register",
  "/recovery",
  "/verification",
  "/settings",
]);

function getAnalyticsSecret() {
  return (
    process.env.ANALYTICS_CONTEXT_SECRET ||
    process.env.REGISTRATION_SESSION_SECRET
  );
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

  const nextContext = buildAnalyticsContextFromUrl(request.nextUrl);
  const currentContext = await readAnalyticsContextFromRequest(request);

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
  });

  return resp.ok;
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
    return oryMiddleware(request);
  }

  const analyticsResponse = await maybeRefreshAnalyticsContext(request);
  if (analyticsResponse) {
    return analyticsResponse;
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    path.startsWith(route),
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => path.startsWith(route));
  const isLandingRoute = path === "/";

  if (isProtectedRoute || isAuthRoute || isLandingRoute) {
    let isAuthenticated = false;

    try {
      isAuthenticated = await hasOrySession(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error checking Ory session in proxy:", { message });
    }

    if (isProtectedRoute && !isAuthenticated) {
      return redirectTo(request, ROUTES.login);
    }

    if (isAuthRoute && isAuthenticated) {
      return redirectTo(request, ROUTES.dashboard);
    }

    if (isLandingRoute && isAuthenticated) {
      return redirectTo(request, ROUTES.dashboard);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
