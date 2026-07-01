import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/constants/routes";
import {
  clearStaleBrowserFlowCookies,
  serializeClearCookie,
} from "@/lib/ory/browser-cookie-reset";
import { getOryClient } from "@/lib/ory/client";
import { extractSetCookieHeaders, getServerCookies } from "@/lib/ory/cookies";

function getSetCookieName(setCookie: string) {
  return setCookie.split(";")[0]?.split("=")[0]?.trim();
}

/**
 * POST /api/ory/logout
 *
 * Performs logout using Ory's self-service logout flow:
 * 1. Creates a logout flow (gets the logout URL/token)
 * 2. Calls the logout URL to invalidate the session
 * 3. Forwards Set-Cookie headers to clean up browser cookies
 *
 * Response:
 *   { success: true, redirect_to: string }
 */
export async function POST() {
  try {
    const cookie = await getServerCookies();

    // Step 1: Create a self-service logout flow for browser
    const oryClient = getOryClient();
    const { data: logoutFlow } = await oryClient.createBrowserLogoutFlow({
      cookie,
    });

    // Step 2: Perform the logout by calling the logout URL
    // The logout_url contains the token needed to invalidate the session
    const logoutToken = logoutFlow.logout_token;

    const logoutResponse = await oryClient.updateLogoutFlow(
      {
        token: logoutToken,
      },
      {
        headers: {
          Cookie: cookie,
        },
      },
    );

    // Step 3: Forward Set-Cookie headers from Ory to clean up browser cookies
    const response = NextResponse.json({
      success: true,
      redirect_to: ROUTES.login,
    });

    const setCookies = extractSetCookieHeaders(logoutResponse);
    const clearedByOry = new Set<string>();
    for (const setCookie of setCookies) {
      const name = getSetCookieName(setCookie);
      if (name) {
        clearedByOry.add(name);
      }
      response.headers.append("Set-Cookie", setCookie);
    }
    for (const staleCookie of clearStaleBrowserFlowCookies(cookie, {
      includeAnalyticsContext: true,
    })) {
      if (clearedByOry.has(staleCookie.name)) {
        continue;
      }
      response.headers.append("Set-Cookie", serializeClearCookie(staleCookie));
    }

    return response;
  } catch (error: unknown) {
    console.error("[/api/ory/logout] Error during logout:", error);

    // If session is already expired/invalid, treat as success
    const status =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;

    if (status === 401 || status === 403) {
      const response = NextResponse.json({
        success: true,
        redirect_to: ROUTES.login,
      });
      const cookie = await getServerCookies();
      for (const staleCookie of clearStaleBrowserFlowCookies(cookie, {
        includeAnalyticsContext: true,
      })) {
        response.cookies.set(staleCookie);
      }
      return response;
    }

    return NextResponse.json(
      {
        success: false,
        code: "ory_logout_failed",
        error: "Failed to logout",
      },
      { status: 500 },
    );
  }
}
