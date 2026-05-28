import type { AnalyticsContext } from "./context-core";
import type { AnalyticsEventInput } from "./emitter";
import type { JourneyEventRequest } from "./types";

export function buildTrustedJourneyEventInput(
  body: JourneyEventRequest,
  context: AnalyticsContext | null | undefined,
): AnalyticsEventInput {
  return {
    eventName: body.eventName,
    source: "registry-journey",
    step: body.step ?? body.eventName,
    outcome: body.outcome ?? "entered",
    errorCode: body.errorCode,
    flowId: body.flowId,
    oryFlowType: body.oryFlowType,
    clientId: context?.clientId,
    linkageStatus: context?.linkageStatus,
    journeyId: context?.journeyId,
    returnUrl: context?.returnUrl,
  };
}
