import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ANALYTICS_CONTEXT_COOKIE,
  buildAnalyticsContextFromUrl,
  parseAnalyticsContext,
  serializeAnalyticsContext,
  shouldRefreshAnalyticsContext,
} from "@/lib/analytics/context-core";
import oryConfig from "@/ory.config";

const oryMiddleware = createOryMiddleware(oryConfig);
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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (AUTH_ENTRY_PATHS.has(pathname)) {
    const nextContext = buildAnalyticsContextFromUrl(request.nextUrl);
    const currentContext = await readAnalyticsContextFromRequest(request);

    if (shouldRefreshAnalyticsContext(currentContext, nextContext)) {
      const response = NextResponse.next();
      const secret = getAnalyticsSecret();
      if (secret) {
        response.cookies.set({
          name: ANALYTICS_CONTEXT_COOKIE,
          value: await serializeAnalyticsContext(nextContext, secret),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60,
        });
      }
      return response;
    }

    return NextResponse.next();
  }

  return oryMiddleware(request);
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/recovery",
    "/verification",
    "/settings",
    "/self-service/:path*",
    "/sessions/whoami",
    "/ui/:path*",
    "/.well-known/ory/:path*",
    "/.ory/:path*",
  ],
};
