import { NextResponse } from "next/server";

import { clearStaleBrowserFlowCookies } from "@/lib/ory/browser-cookie-reset";
import { getServerCookies } from "@/lib/ory/cookies";
import { clearRegistrationAccountDraftCookie } from "@/lib/services/registration/registration-account-draft.service";
import { clearRegistrationLivenessChallengeCookie } from "@/lib/services/registration/registration-liveness-challenge.service";
import { clearRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service";
import type { RegistrationSessionResetResponse } from "@/lib/types/registration/session";

export async function POST() {
  try {
    const cookieHeader = await getServerCookies();
    const response = NextResponse.json(
      { success: true } satisfies RegistrationSessionResetResponse,
      { status: 200 },
    );
    response.cookies.set(clearRegistrationSessionCookie());
    response.cookies.set(clearRegistrationAccountDraftCookie());
    response.cookies.set(clearRegistrationLivenessChallengeCookie());
    for (const cookie of clearStaleBrowserFlowCookies(cookieHeader)) {
      response.cookies.set(cookie);
    }

    return response;
  } catch (error) {
    console.error(
      "[/api/registration/session/reset] Failed to clear registration session:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        code: "unexpected_error",
      } satisfies RegistrationSessionResetResponse,
      { status: 500 },
    );
  }
}
