import { createOryMiddleware } from "@ory/nextjs/middleware";
import { NextResponse, type NextRequest } from "next/server";

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

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Redirect root to dashboard
  if (path === "/") {
    url.pathname = ROUTES.dashboard;
    return NextResponse.redirect(url);
  }

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

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => path.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => path.startsWith(route));

  if (isProtectedRoute || isAuthRoute) {
    let isAuthenticated = false;

    try {
      // Check session with Ory by proxying to the local Next.js route
      const cookie = request.headers.get("cookie") || "";
      const resp = await fetch(`${request.nextUrl.origin}/sessions/whoami`, {
        headers: { cookie },
        cache: "no-store",
      });

      if (resp.ok) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.error("Error checking Ory session in proxy:", error);
    }

    if (isProtectedRoute && !isAuthenticated) {
      url.pathname = ROUTES.login;
      return NextResponse.redirect(url);
    }

    if (isAuthRoute && isAuthenticated) {
      url.pathname = ROUTES.dashboard;
      return NextResponse.redirect(url);
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
