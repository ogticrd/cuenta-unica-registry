import { describe, expect, it } from "vitest";
import { buildJourneyEventPayload } from "@/components/analytics/journey-event";

describe("buildJourneyEventPayload", () => {
  it("forwards resolved client context fields to journey tracking", () => {
    expect(
      buildJourneyEventPayload({
        eventName: "journey.login.entered",
        step: "login",
        flowId: "flow-123",
        oryFlowType: "login",
        clientId: "client-123",
        clientName: "Client 123",
        institutionName: "Institution 123",
        linkageStatus: "linked",
        returnUrl: "https://client.example.test/callback",
      }),
    ).toEqual({
      clientId: "client-123",
      clientName: "Client 123",
      errorCode: undefined,
      eventName: "journey.login.entered",
      flowId: "flow-123",
      institutionName: "Institution 123",
      linkageStatus: "linked",
      metadata: undefined,
      oryFlowType: "login",
      outcome: undefined,
      returnUrl: "https://client.example.test/callback",
      sessionId: undefined,
      step: "login",
    });
  });
});
