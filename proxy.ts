import { createOryMiddleware } from "@ory/nextjs/middleware";
import { type NextRequest, NextResponse } from "next/server";

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

  // Let Ory handle its own internal proxy routes
  if (
    path.startsWith("/.ory") ||
    path.startsWith("/self-service") ||
    path.startsWith("/ui") ||
    path.startsWith("/sessions") ||
    path.startsWith("/.well-known/ory")
  ) {
    return oryMiddleware(request);
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
