import { randomUUID, webcrypto } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  isJourneyEventName,
  normalizeClientId,
  resolveLinkageStatus,
} from "@/lib/analytics/catalog";
import {
  type AnalyticsContext,
  buildAnalyticsContextFromUrl,
  parseAnalyticsContext,
  serializeAnalyticsContext,
  shouldRefreshAnalyticsContext,
} from "@/lib/analytics/context-core";
import { buildTrustedJourneyEventInput } from "@/lib/analytics/journey-event";
import {
  addAnalyticsTransientPayloadNode,
  buildAnalyticsTransientPayload,
  resolveAnalyticsTransientPayloadForFlow,
} from "@/lib/analytics/transient-payload-core";

const TEST_SECRET =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const currentCrypto = globalThis.crypto;
if (!currentCrypto?.subtle || typeof currentCrypto.randomUUID !== "function") {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      ...(currentCrypto ?? {}),
      subtle: webcrypto.subtle,
      randomUUID,
    },
  });
}

describe("analytics context", () => {
  test("round-trips a signed analytics context cookie", async () => {
    const context: AnalyticsContext = {
      journeyId: "journey-123",
      clientId: "ministerio-salud",
      linkageStatus: "linked",
      entryPath: "/register",
      issuedAt: 1,
      expiresAt: Date.now() + 1000,
      returnUrl: "https://example.com",
    };

    const serialized = await serializeAnalyticsContext(context, TEST_SECRET);
    const parsed = await parseAnalyticsContext(serialized, TEST_SECRET);

    expect(parsed?.journeyId).toBe("journey-123");
    expect(parsed?.clientId).toBe("ministerio-salud");
    expect(parsed?.linkageStatus).toBe("linked");
  });

  test("builds a fresh context from an auth entry request", () => {
    const context = buildAnalyticsContextFromUrl(
      new URL(
        "https://app.example.com/register?client_id=ministerio-salud&return_url=https%3A%2F%2Fbackoffice.example.com",
      ),
    );

    expect(context.entryPath).toBe("/register");
    expect(context.clientId).toBe("ministerio-salud");
    expect(context.linkageStatus).toBe("linked");
    expect(context.returnUrl).toBe("https://backoffice.example.com");
  });

  test("refreshes when the entry path, client, or return URL changes", () => {
    const current: AnalyticsContext = {
      journeyId: "journey-123",
      clientId: "ministerio-salud",
      linkageStatus: "linked",
      entryPath: "/register",
      issuedAt: 1,
      expiresAt: Date.now() + 1000,
      returnUrl: "https://example.com",
    };

    const nextSame: AnalyticsContext = { ...current };

    const nextDifferent: AnalyticsContext = {
      ...current,
      entryPath: "/login",
    };

    const nextReturnUrl: AnalyticsContext = {
      ...current,
      returnUrl: "https://different.example.com",
    };

    expect(shouldRefreshAnalyticsContext(current, nextSame)).toBe(false);
    expect(shouldRefreshAnalyticsContext(current, nextDifferent)).toBe(true);
    expect(shouldRefreshAnalyticsContext(current, nextReturnUrl)).toBe(true);
  });
});

describe("analytics catalog", () => {
  test("normalizes client linkage and journey event names", () => {
    expect(normalizeClientId("")).toBe("__unlinked__");
    expect(resolveLinkageStatus("__unlinked__")).toBe("unlinked");
    expect(isJourneyEventName("journey.login.entered")).toBe(true);
    expect(isJourneyEventName("identity.registration.succeeded")).toBe(false);
  });
});

describe("analytics transient payload", () => {
  test("builds Ory transient payload from analytics context", () => {
    const payload = buildAnalyticsTransientPayload(
      {
        journeyId: "journey-123",
        clientId: "ministerio-salud",
        linkageStatus: "linked",
        entryPath: "/login",
        issuedAt: 1,
        expiresAt: Date.now() + 1000,
        returnUrl: "https://example.com",
      },
      {
        projectId: "registry",
        environment: "test",
      },
    );

    expect(payload.analytics.clientId).toBe("ministerio-salud");
    expect(payload.analytics.journeyId).toBe("journey-123");
    expect(payload.analytics.returnUrl).toBe("https://example.com");
    expect(payload.analytics.projectId).toBe("registry");
    expect(payload.analytics.environment).toBe("test");
  });

  test("adds hidden transient_payload node to Ory flow", () => {
    const payload = buildAnalyticsTransientPayload({
      journeyId: "journey-123",
      clientId: "ministerio-salud",
      linkageStatus: "linked",
      entryPath: "/login",
      issuedAt: 1,
      expiresAt: Date.now() + 1000,
    });

    const flow = addAnalyticsTransientPayloadNode(
      {
        id: "flow-123",
        ui: {
          nodes: [],
        },
      },
      payload,
    );

    const node = flow.ui.nodes[0] as {
      attributes: { name: string; type: string; value: string };
    };

    expect(node.attributes.name).toBe("transient_payload");
    expect(node.attributes.type).toBe("hidden");
    expect(JSON.parse(node.attributes.value).analytics.clientId).toBe(
      "ministerio-salud",
    );
  });

  test("uses Ory OAuth client when cookie context is unlinked", () => {
    const payload = buildAnalyticsTransientPayload({
      journeyId: "journey-123",
      clientId: "__unlinked__",
      linkageStatus: "unlinked",
      entryPath: "/login",
      issuedAt: 1,
      expiresAt: Date.now() + 1000,
    });

    const resolved = resolveAnalyticsTransientPayloadForFlow(
      {
        id: "flow-123",
        request_url: "https://cuenta.example.com/self-service/login/browser",
        oauth2_login_request: {
          client: {
            client_id: "backoffice-client",
            client_name: "Backoffice",
            metadata: {
              institutionName: "OGTIC",
            },
          },
        },
        ui: { nodes: [] },
      },
      payload,
    );

    expect(resolved?.analytics.clientId).toBe("backoffice-client");
    expect(resolved?.analytics.clientName).toBe("Backoffice");
    expect(resolved?.analytics.institutionName).toBe("OGTIC");
    expect(resolved?.analytics.linkageStatus).toBe("linked");
    expect(resolved?.analytics.journeyId).toBe("journey-123");
  });
});

describe("analytics journey route contract", () => {
  test("uses signed context instead of browser-provided client metadata", () => {
    const event = buildTrustedJourneyEventInput(
      {
        eventName: "journey.login.entered",
        clientId: "spoofed-client",
        clientName: "Spoofed Client",
        institutionName: "Spoofed Institution",
        linkageStatus: "unlinked",
        returnUrl: "https://attacker.example",
        identityId: "spoofed-identity",
        sessionId: "spoofed-session",
        metadata: { injected: true },
      },
      {
        journeyId: "journey-123",
        clientId: "trusted-client",
        linkageStatus: "linked",
        entryPath: "/login",
        issuedAt: 1,
        expiresAt: Date.now() + 1000,
        returnUrl: "https://trusted.example",
      },
    );

    expect(event.clientId).toBe("trusted-client");
    expect(event.linkageStatus).toBe("linked");
    expect(event.journeyId).toBe("journey-123");
    expect(event.returnUrl).toBe("https://trusted.example");
    expect(event.clientName).toBeUndefined();
    expect(event.institutionName).toBeUndefined();
    expect(event.identityId).toBeUndefined();
    expect(event.sessionId).toBeUndefined();
    expect(event.metadata).toBeUndefined();
  });
});
