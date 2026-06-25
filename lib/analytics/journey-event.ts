import type { AnalyticsContext } from "./context-core";
import type { AnalyticsEventInput } from "./emitter";
import type { JourneyEventRequest } from "./types";

function pickContextValue<T>(
  contextValue: T | undefined,
  bodyValue: T | undefined,
) {
  return contextValue ?? bodyValue;
}

export function buildTrustedJourneyEventInput(
  body: JourneyEventRequest,
  context: AnalyticsContext | null | undefined,
): AnalyticsEventInput {
  const clientId = pickContextValue(context?.clientId, body.clientId);

  return {
    eventName: body.eventName,
    source: "registry-journey",
    step: body.step ?? body.eventName,
    outcome: body.outcome ?? "entered",
    errorCode: body.errorCode,
    flowId: body.flowId,
    oryFlowType: body.oryFlowType,
    clientId,
    clientName: pickContextValue(context?.clientName, body.clientName),
    institutionName: pickContextValue(
      context?.institutionName,
      body.institutionName,
    ),
    linkageStatus:
      context?.linkageStatus === "linked"
        ? context.linkageStatus
        : (body.linkageStatus ?? context?.linkageStatus),
    journeyId: context?.journeyId,
    returnUrl: pickContextValue(context?.returnUrl, body.returnUrl),
  };
}
