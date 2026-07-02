import "server-only";

import type { AnalyticsEventInput } from "@/lib/analytics/emitter";
import type { RegistrationSession } from "@/lib/types/registration/session";

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
