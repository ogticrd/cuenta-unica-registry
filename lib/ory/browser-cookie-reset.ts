import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import {
  ANALYTICS_CONTEXT_COOKIE,
  ANALYTICS_CONTEXT_LAUNCH_COOKIE,
} from "@/lib/analytics/context-core";

const STATIC_RESET_COOKIE_NAMES = [
  ANALYTICS_CONTEXT_COOKIE,
  ANALYTICS_CONTEXT_LAUNCH_COOKIE,
] as const;

const RESET_COOKIE_PREFIXES = ["ory_session", "csrf_token"] as const;

function parseCookieNames(cookieHeader: string) {
  const names = new Set<string>();

  for (const segment of cookieHeader.split(";")) {
    const name = segment.trim().split("=")[0]?.trim();

    if (name) {
      names.add(name);
    }
  }

  return names;
}

function shouldClearBrowserCookie(name: string) {
  return RESET_COOKIE_PREFIXES.some(
    (prefix) => name === prefix || name.startsWith(`${prefix}_`),
  );
}

function clearCookie(name: string): ResponseCookie {
  return {
    name,
    value: "",
    path: "/",
    maxAge: 0,
  };
}

export function clearStaleBrowserFlowCookies(
  cookieHeader: string,
): ResponseCookie[] {
  const names = new Set<string>(STATIC_RESET_COOKIE_NAMES);

  for (const name of parseCookieNames(cookieHeader)) {
    if (shouldClearBrowserCookie(name)) {
      names.add(name);
    }
  }

  return Array.from(names).map(clearCookie);
}

export function serializeClearCookie(cookie: ResponseCookie) {
  return `${cookie.name}=; Path=${cookie.path ?? "/"}; Max-Age=0`;
}
