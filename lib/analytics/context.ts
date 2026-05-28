import "server-only";

import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import {
  ANALYTICS_CONTEXT_COOKIE,
  ANALYTICS_CONTEXT_DURATION_MS,
  type AnalyticsContext,
  buildAnalyticsContextFromUrl,
  parseAnalyticsContext,
  serializeAnalyticsContext,
} from "./context-core";

function getAnalyticsSecret() {
  return (
    process.env.ANALYTICS_CONTEXT_SECRET ||
    process.env.REGISTRATION_SESSION_SECRET
  );
}

export async function readAnalyticsContextFromRequest(
  request: NextRequest,
): Promise<AnalyticsContext | null> {
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

export async function createAnalyticsContextCookie(
  context: AnalyticsContext,
): Promise<ResponseCookie> {
  const secret = getAnalyticsSecret();

  if (!secret) {
    throw new Error(
      "Missing ANALYTICS_CONTEXT_SECRET or REGISTRATION_SESSION_SECRET environment variable",
    );
  }

  return {
    name: ANALYTICS_CONTEXT_COOKIE,
    value: await serializeAnalyticsContext(context, secret),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ANALYTICS_CONTEXT_DURATION_MS / 1000,
  };
}

export function createAnalyticsContextFromRequest(request: NextRequest) {
  return buildAnalyticsContextFromUrl(request.nextUrl);
}

export function shouldRefreshAnalyticsContext(
  current: AnalyticsContext | null,
  nextContext: AnalyticsContext,
) {
  if (!current) {
    return true;
  }

  if (current.expiresAt < Date.now()) {
    return true;
  }

  if (current.entryPath !== nextContext.entryPath) {
    return true;
  }

  if (current.clientId !== nextContext.clientId) {
    return true;
  }

  if ((current.returnUrl ?? "") !== (nextContext.returnUrl ?? "")) {
    return true;
  }

  return false;
}

export async function getAnalyticsContext(): Promise<AnalyticsContext | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(ANALYTICS_CONTEXT_COOKIE)?.value;

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

export async function resolveAnalyticsContext(
  fallback?: Partial<Pick<AnalyticsContext, "entryPath" | "returnUrl">>,
): Promise<AnalyticsContext> {
  const current = await getAnalyticsContext();

  if (current) {
    return current;
  }

  const now = Date.now();
  return {
    journeyId: globalThis.crypto.randomUUID(),
    clientId: "__unlinked__",
    linkageStatus: "unlinked",
    entryPath: fallback?.entryPath ?? "server",
    issuedAt: now,
    expiresAt: now + ANALYTICS_CONTEXT_DURATION_MS,
    ...(fallback?.returnUrl ? { returnUrl: fallback.returnUrl } : {}),
  };
}
