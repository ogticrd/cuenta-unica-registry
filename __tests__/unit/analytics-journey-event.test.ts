import { describe, expect, it } from "vitest";
import type { AnalyticsContext } from "@/lib/analytics/context-core";
import { buildTrustedJourneyEventInput } from "@/lib/analytics/journey-event";

const linkedContext: AnalyticsContext = {
  journeyId: "journey-cookie",
  clientId: "client-cookie",
  clientName: "Cookie Client",
  institutionName: "Cookie Institution",
  linkageStatus: "linked",
  entryPath: "/login",
  issuedAt: 1,
  expiresAt: Date.now() + 60_000,
  returnUrl: "https://client.example.test/callback",
};

describe("buildTrustedJourneyEventInput", () => {
  it("keeps the signed analytics context ahead of client-supplied event fields", () => {
    const event = buildTrustedJourneyEventInput(
      {
        eventName: "journey.login.entered",
        clientId: "client-body",
        clientName: "Body Client",
        institutionName: "Body Institution",
        linkageStatus: "linked",
        returnUrl: "https://body.example.test/callback",
      },
      linkedContext,
    );

    expect(event).toMatchObject({
      clientId: "client-cookie",
      clientName: "Cookie Client",
      institutionName: "Cookie Institution",
      linkageStatus: "linked",
      journeyId: "journey-cookie",
      returnUrl: "https://client.example.test/callback",
    });
  });

  it("uses event client fields when no signed context is available", () => {
    const event = buildTrustedJourneyEventInput(
      {
        eventName: "journey.login.entered",
        clientId: "client-body",
        clientName: "Body Client",
        institutionName: "Body Institution",
        linkageStatus: "linked",
        returnUrl: "https://body.example.test/callback",
      },
      null,
    );

    expect(event).toMatchObject({
      clientId: "client-body",
      clientName: "Body Client",
      institutionName: "Body Institution",
      linkageStatus: "linked",
      returnUrl: "https://body.example.test/callback",
    });
  });
});
