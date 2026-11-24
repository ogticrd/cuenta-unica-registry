import "server-only";

import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { AnalyticsEventInput } from "@/lib/analytics/emitter";
import { parseRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service";
import type { RegistrationSession } from "@/lib/types/registration/session";

export function getRegistrationRequestJourneyId(request: Request) {
  const rawSession = new RequestCookies(request.headers).get(
    "registration_session",
  )?.value;
  if (!rawSession || !process.env.REGISTRATION_SESSION_SECRET) return undefined;

  return getRegistrationSessionAnalyticsContext(
    parseRegistrationSessionCookie(rawSession),
  )?.journeyId;
}

export function getRegistrationSessionAnalyticsContext(
  session: RegistrationSession | null | undefined,
) {
  const analytics = session?.analytics;

  if (!analytics || analytics.expiresAt < Date.now()) {
    return undefined;
  }

  return analytics;
}

export function withRegistrationSessionAnalyticsContext(
  input: AnalyticsEventInput,
  session: RegistrationSession | null | undefined,
): AnalyticsEventInput {
  const analytics = getRegistrationSessionAnalyticsContext(session);

  if (!analytics) {
    return input;
  }

  return {
    ...input,
    journeyId: input.journeyId ?? analytics.journeyId,
    clientId: input.clientId ?? analytics.clientId,
    clientName: input.clientName ?? analytics.clientName,
    institutionName: input.institutionName ?? analytics.institutionName,
    linkageStatus: input.linkageStatus ?? analytics.linkageStatus,
    returnUrl: input.returnUrl ?? analytics.returnUrl,
  };
}
