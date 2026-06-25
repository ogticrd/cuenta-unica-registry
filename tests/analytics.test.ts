import { randomUUID, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  isJourneyEventName,
  normalizeClientId,
  resolveLinkageStatus,
} from "@/lib/analytics/catalog";
import {
  getAnalyticsLaunchClientId,
  getAnalyticsLaunchReturnUrl,
  isAllowedAnalyticsReturnUrl,
} from "@/lib/analytics/client-launch-core";
import {
  type AnalyticsContext,
  buildAnalyticsContextFromUrl,
  parseAnalyticsContext,
  serializeAnalyticsContext,
  shouldRefreshAnalyticsContext,
} from "@/lib/analytics/context-core";
import {
  resolveAnalyticsEnvironment,
  resolveAnalyticsProjectId,
} from "@/lib/analytics/environment";
import { buildTrustedJourneyEventInput } from "@/lib/analytics/journey-event";
import {
  addAnalyticsTransientPayloadNode,
  buildAnalyticsTransientPayload,
  resolveAnalyticsTransientPayloadForFlow,
} from "@/lib/analytics/transient-payload-core";

const TEST_SECRET =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const nextHeadersMocks = vi.hoisted(() => ({
  cookies: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: nextHeadersMocks.cookies,
}));

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

function setNodeEnv(value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;

  if (value === undefined) {
    delete env.NODE_ENV;
  } else {
    env.NODE_ENV = value;
  }
}

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

function buildTestContext(
  overrides: Partial<AnalyticsContext> = {},
): AnalyticsContext {
  return {
    journeyId: "journey-123",
    clientId: "ministerio-salud",
    linkageStatus: "linked",
    entryPath: "/register",
    issuedAt: 1,
    expiresAt: Date.now() + 1000,
    ...overrides,
  };
}

describe("analytics context", () => {
  test("round-trips a signed analytics context cookie", async () => {
    const context: AnalyticsContext = {
      journeyId: "journey-123",
      clientId: "ministerio-salud",
      clientName: "Supertest",
      institutionName: "Ministerio de Salud",
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
    expect(parsed?.clientName).toBe("Supertest");
    expect(parsed?.institutionName).toBe("Ministerio de Salud");
    expect(parsed?.linkageStatus).toBe("linked");
  });

  test("builds a fresh context from a server-validated client", () => {
    const context = buildAnalyticsContextFromUrl(
      new URL(
        "https://app.example.com/register?client_id=ministerio-salud&return_url=https%3A%2F%2Fbackoffice.example.com%2F",
      ),
      {
        client: {
          clientId: "ministerio-salud",
          clientName: "Supertest",
          institutionName: "Ministerio de Salud",
        },
      },
    );

    expect(context.entryPath).toBe("/register");
    expect(context.clientId).toBe("ministerio-salud");
    expect(context.clientName).toBe("Supertest");
    expect(context.institutionName).toBe("Ministerio de Salud");
    expect(context.linkageStatus).toBe("linked");
    expect(context.returnUrl).toBe("https://backoffice.example.com/");
  });

  test("does not trust direct client_id without a validated client", () => {
    const url = new URL(
      "https://app.example.com/register?client_id=spoofed-client",
    );

    expect(buildAnalyticsContextFromUrl(url)).toMatchObject({
      clientId: "__unlinked__",
      linkageStatus: "unlinked",
    });
    expect(
      buildAnalyticsContextFromUrl(url, {
        client: { clientId: "trusted-client" },
      }),
    ).toMatchObject({
      clientId: "trusted-client",
      linkageStatus: "linked",
    });
  });

  test("refreshes when the entry path, client, or return URL changes", () => {
    const current: AnalyticsContext = {
      journeyId: "journey-123",
      clientId: "ministerio-salud",
      clientName: "Supertest",
      institutionName: "Ministerio de Salud",
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

  test("refreshes for missing, expired, or client-changed context", () => {
    const current = buildTestContext();

    expect(shouldRefreshAnalyticsContext(null, current)).toBe(true);
    expect(
      shouldRefreshAnalyticsContext(
        buildTestContext({ expiresAt: Date.now() - 1 }),
        current,
      ),
    ).toBe(true);
    expect(
      shouldRefreshAnalyticsContext(current, {
        ...current,
        clientId: "another-client",
      }),
    ).toBe(true);
  });
});

describe("analytics server context", () => {
  const originalAnalyticsContextSecret = process.env.ANALYTICS_CONTEXT_SECRET;
  const originalRegistrationSessionSecret =
    process.env.REGISTRATION_SESSION_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.ANALYTICS_CONTEXT_SECRET = TEST_SECRET;
    delete process.env.REGISTRATION_SESSION_SECRET;
    setNodeEnv("test");
    nextHeadersMocks.cookies.mockReset();
  });

  afterEach(() => {
    restoreEnvValue("ANALYTICS_CONTEXT_SECRET", originalAnalyticsContextSecret);
    restoreEnvValue(
      "REGISTRATION_SESSION_SECRET",
      originalRegistrationSessionSecret,
    );
    setNodeEnv(originalNodeEnv);
    vi.restoreAllMocks();
  });

  test("reads a valid analytics context from the request cookie", async () => {
    const { ANALYTICS_CONTEXT_COOKIE } = await import(
      "@/lib/analytics/context-core"
    );
    const { createAnalyticsContextCookie, readAnalyticsContextFromRequest } =
      await import("@/lib/analytics/context");
    const cookie = await createAnalyticsContextCookie(buildTestContext());

    const parsed = await readAnalyticsContextFromRequest({
      cookies: {
        get: (name: string) =>
          name === ANALYTICS_CONTEXT_COOKIE ? { value: cookie.value } : null,
      },
    } as never);

    expect(cookie.name).toBe(ANALYTICS_CONTEXT_COOKIE);
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.secure).toBe(false);
    expect(cookie.sameSite).toBe("strict");
    expect(parsed?.journeyId).toBe("journey-123");
    expect(parsed?.clientId).toBe("ministerio-salud");
  });

  test("rejects missing, expired, unsigned, and secretless request cookies", async () => {
    const { createAnalyticsContextCookie, readAnalyticsContextFromRequest } =
      await import("@/lib/analytics/context");
    const expiredCookie = await createAnalyticsContextCookie(
      buildTestContext({ expiresAt: Date.now() - 1 }),
    );

    const requestWithCookie = (value?: string) =>
      ({
        cookies: {
          get: () => (value ? { value } : undefined),
        },
      }) as never;

    await expect(
      readAnalyticsContextFromRequest(requestWithCookie()),
    ).resolves.toBeNull();
    await expect(
      readAnalyticsContextFromRequest(requestWithCookie("not.signed")),
    ).resolves.toBeNull();
    await expect(
      readAnalyticsContextFromRequest(requestWithCookie(expiredCookie.value)),
    ).resolves.toBeNull();

    delete process.env.ANALYTICS_CONTEXT_SECRET;

    await expect(
      readAnalyticsContextFromRequest(requestWithCookie(expiredCookie.value)),
    ).resolves.toBeNull();
  });

  test("reads analytics context from next cookies and falls back to an unlinked shell", async () => {
    const { createAnalyticsContextCookie, getAnalyticsContext } = await import(
      "@/lib/analytics/context"
    );
    const cookie = await createAnalyticsContextCookie(
      buildTestContext({ returnUrl: "https://client.example/callback" }),
    );

    nextHeadersMocks.cookies.mockResolvedValue({
      get: () => ({ value: cookie.value }),
    });

    await expect(getAnalyticsContext()).resolves.toMatchObject({
      journeyId: "journey-123",
      returnUrl: "https://client.example/callback",
    });

    const { resolveAnalyticsContext } = await import("@/lib/analytics/context");
    await expect(resolveAnalyticsContext()).resolves.toMatchObject({
      journeyId: "journey-123",
      clientId: "ministerio-salud",
    });

    nextHeadersMocks.cookies.mockResolvedValue(undefined);

    await expect(
      resolveAnalyticsContext({
        entryPath: "/support",
        returnUrl: "https://client.example/help",
      }),
    ).resolves.toMatchObject({
      clientId: "__unlinked__",
      linkageStatus: "unlinked",
      entryPath: "/support",
      returnUrl: "https://client.example/help",
    });
  });

  test("throws when creating a context cookie without a signing secret", async () => {
    delete process.env.ANALYTICS_CONTEXT_SECRET;
    delete process.env.REGISTRATION_SESSION_SECRET;

    const { createAnalyticsContextCookie } = await import(
      "@/lib/analytics/context"
    );

    await expect(
      createAnalyticsContextCookie(buildTestContext()),
    ).rejects.toThrow("Missing ANALYTICS_CONTEXT_SECRET");
  });

  test("does not create linked request context from raw client_id by default", async () => {
    const originalAllowDirectClientId =
      process.env.ANALYTICS_ALLOW_DIRECT_CLIENT_ID;
    const { createAnalyticsContextFromRequest } = await import(
      "@/lib/analytics/context"
    );
    const request = {
      nextUrl: new URL(
        "https://cuenta.example/register?client_id=registry-web&return_to=https%3A%2F%2Fclient.example%2F",
      ),
    } as never;

    try {
      delete process.env.ANALYTICS_ALLOW_DIRECT_CLIENT_ID;
      expect(createAnalyticsContextFromRequest(request)).toMatchObject({
        clientId: "__unlinked__",
        linkageStatus: "unlinked",
        entryPath: "/register",
        returnUrl: "https://client.example/",
      });

      process.env.ANALYTICS_ALLOW_DIRECT_CLIENT_ID = "true";
      expect(createAnalyticsContextFromRequest(request)).toMatchObject({
        clientId: "registry-web",
        linkageStatus: "linked",
        entryPath: "/register",
        returnUrl: "https://client.example/",
      });
    } finally {
      restoreEnvValue(
        "ANALYTICS_ALLOW_DIRECT_CLIENT_ID",
        originalAllowDirectClientId,
      );
    }
  });

  test("refreshes server context by the same cookie identity rules", async () => {
    const { shouldRefreshAnalyticsContext: shouldRefreshServerContext } =
      await import("@/lib/analytics/context");
    const current = buildTestContext();

    expect(shouldRefreshServerContext(null, current)).toBe(true);
    expect(
      shouldRefreshServerContext(
        buildTestContext({ expiresAt: Date.now() - 1 }),
        current,
      ),
    ).toBe(true);
    expect(
      shouldRefreshServerContext(current, {
        ...current,
        entryPath: "/login",
      }),
    ).toBe(true);
    expect(
      shouldRefreshServerContext(current, {
        ...current,
        clientId: "other-client",
      }),
    ).toBe(true);
    expect(
      shouldRefreshServerContext(current, {
        ...current,
        returnUrl: "https://other.example",
      }),
    ).toBe(true);
    expect(shouldRefreshServerContext(current, { ...current })).toBe(false);
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

describe("analytics client launch", () => {
  test("reads client launch params and validates return URLs", () => {
    const url = new URL(
      "https://cuenta.example/api/analytics/start?client_id=ory-client-dgii&return_url=https%3A%2F%2Fdgii.gob.do%2Fcallback",
    );

    expect(getAnalyticsLaunchClientId(url)).toBe("ory-client-dgii");
    expect(getAnalyticsLaunchReturnUrl(url)).toBe(
      "https://dgii.gob.do/callback",
    );
    expect(
      isAllowedAnalyticsReturnUrl("https://dgii.gob.do/callback", [
        "https://dgii.gob.do/callback",
      ]),
    ).toBe(true);
    expect(
      isAllowedAnalyticsReturnUrl("https://evil.example", [
        "https://dgii.gob.do/callback",
      ]),
    ).toBe(false);
  });
});

describe("analytics runtime environment", () => {
  test("normalizes development analytics environment to dev", () => {
    expect(resolveAnalyticsEnvironment("development")).toBe("dev");
    expect(resolveAnalyticsEnvironment(" staging ")).toBe("staging");
  });

  test("uses configured environment and project identifiers", () => {
    const originalAnalyticsEnvironment = process.env.ANALYTICS_ENVIRONMENT;
    const originalAnalyticsProjectId = process.env.ANALYTICS_PROJECT_ID;
    const originalOryProjectId = process.env.ORY_PROJECT_ID;

    process.env.ANALYTICS_ENVIRONMENT = "dev";
    process.env.ANALYTICS_PROJECT_ID = "analytics-project";
    process.env.ORY_PROJECT_ID = "ory-project";

    try {
      expect(resolveAnalyticsEnvironment()).toBe("dev");
      expect(resolveAnalyticsProjectId()).toBe("analytics-project");

      delete process.env.ANALYTICS_PROJECT_ID;
      expect(resolveAnalyticsProjectId()).toBe("ory-project");
      expect(resolveAnalyticsProjectId(" explicit-project ")).toBe(
        "explicit-project",
      );
    } finally {
      restoreEnvValue("ANALYTICS_ENVIRONMENT", originalAnalyticsEnvironment);
      restoreEnvValue("ANALYTICS_PROJECT_ID", originalAnalyticsProjectId);
      restoreEnvValue("ORY_PROJECT_ID", originalOryProjectId);
    }
  });

  test("rejects unsupported analytics environments", () => {
    expect(() => resolveAnalyticsEnvironment("qa")).toThrow(
      "Unsupported ANALYTICS_ENVIRONMENT: qa",
    );
  });

  test("does not classify production runtime as production without explicit analytics environment", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAnalyticsEnvironment = process.env.ANALYTICS_ENVIRONMENT;

    setNodeEnv("production");
    delete process.env.ANALYTICS_ENVIRONMENT;

    try {
      expect(() => resolveAnalyticsEnvironment()).toThrow(
        "ANALYTICS_ENVIRONMENT is required in production",
      );
    } finally {
      setNodeEnv(originalNodeEnv);
      if (originalAnalyticsEnvironment === undefined) {
        delete process.env.ANALYTICS_ENVIRONMENT;
      } else {
        process.env.ANALYTICS_ENVIRONMENT = originalAnalyticsEnvironment;
      }
    }
  });

  test("requires a real project id in production analytics payloads", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAnalyticsProjectId = process.env.ANALYTICS_PROJECT_ID;
    const originalOryProjectId = process.env.ORY_PROJECT_ID;

    setNodeEnv("production");
    delete process.env.ANALYTICS_PROJECT_ID;
    delete process.env.ORY_PROJECT_ID;

    try {
      expect(() => resolveAnalyticsProjectId()).toThrow(
        "ANALYTICS_PROJECT_ID or ORY_PROJECT_ID is required",
      );
    } finally {
      setNodeEnv(originalNodeEnv);
      if (originalAnalyticsProjectId === undefined) {
        delete process.env.ANALYTICS_PROJECT_ID;
      } else {
        process.env.ANALYTICS_PROJECT_ID = originalAnalyticsProjectId;
      }
      if (originalOryProjectId === undefined) {
        delete process.env.ORY_PROJECT_ID;
      } else {
        process.env.ORY_PROJECT_ID = originalOryProjectId;
      }
    }
  });
});

describe("analytics transient payload", () => {
  test("builds Ory transient payload from analytics context", () => {
    const payload = buildAnalyticsTransientPayload(
      {
        journeyId: "journey-123",
        clientId: "ministerio-salud",
        clientName: "Supertest",
        institutionName: "Ministerio de Salud",
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
    expect(payload.analytics.clientName).toBe("Supertest");
    expect(payload.analytics.institutionName).toBe("Ministerio de Salud");
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
          },
        },
        ui: { nodes: [] },
      },
      payload,
    );

    expect(resolved?.analytics.clientId).toBe("backoffice-client");
    expect(resolved?.analytics.linkageStatus).toBe("linked");
    expect(resolved?.analytics.journeyId).toBe("journey-123");
  });

  test("builds payload from Ory flow when cookie payload is absent", () => {
    const resolved = resolveAnalyticsTransientPayloadForFlow(
      {
        id: "",
        request_url: "https://cuenta.example.com/self-service/login/browser",
        return_to: "https://client.example/callback",
        oauth2_login_request: {
          challenge: "login-challenge-123",
          client: {
            client_id: "backoffice-client",
          },
        },
        ui: { nodes: [] },
      },
      undefined,
    );

    expect(resolved?.analytics.clientId).toBe("backoffice-client");
    expect(resolved?.analytics.journeyId).toBe("login-challenge-123");
    expect(resolved?.analytics.entryPath).toBe(
      "https://cuenta.example.com/self-service/login/browser",
    );
    expect(resolved?.analytics.returnUrl).toBe(
      "https://client.example/callback",
    );
  });

  test("skips flow payloads and duplicate hidden nodes when there is nothing to append", () => {
    expect(
      resolveAnalyticsTransientPayloadForFlow({ ui: { nodes: [] } }, null),
    ).toBeUndefined();

    const payload = buildAnalyticsTransientPayload(buildTestContext());
    const flowWithoutUi = { id: "flow-123" };
    expect(addAnalyticsTransientPayloadNode(flowWithoutUi, payload)).toBe(
      flowWithoutUi,
    );

    const flowWithExistingNode = {
      id: "flow-123",
      ui: {
        nodes: [
          {
            attributes: {
              name: "transient_payload",
            },
          },
        ],
      },
    };

    expect(
      addAnalyticsTransientPayloadNode(flowWithExistingNode, payload),
    ).toBe(flowWithExistingNode);
  });
});

describe("analytics emitter", () => {
  const originalAnalyticsIngressUrl = process.env.ANALYTICS_INGRESS_URL;
  const originalAnalyticsApiBaseUrl = process.env.ANALYTICS_API_BASE_URL;
  const originalAnalyticsIngressApiKey = process.env.ANALYTICS_INGRESS_API_KEY;
  const originalAnalyticsIngressApiKeyHeader =
    process.env.ANALYTICS_INGRESS_API_KEY_HEADER;
  const originalAnalyticsEnvironment = process.env.ANALYTICS_ENVIRONMENT;
  const originalAnalyticsProjectId = process.env.ANALYTICS_PROJECT_ID;

  beforeEach(() => {
    delete process.env.ANALYTICS_INGRESS_URL;
    delete process.env.ANALYTICS_API_BASE_URL;
    delete process.env.ANALYTICS_INGRESS_API_KEY;
    delete process.env.ANALYTICS_INGRESS_API_KEY_HEADER;
    process.env.ANALYTICS_ENVIRONMENT = "dev";
    process.env.ANALYTICS_PROJECT_ID = "registry-dev";
    nextHeadersMocks.cookies.mockReset();
    nextHeadersMocks.cookies.mockResolvedValue(undefined);
  });

  afterEach(() => {
    restoreEnvValue("ANALYTICS_INGRESS_URL", originalAnalyticsIngressUrl);
    restoreEnvValue("ANALYTICS_API_BASE_URL", originalAnalyticsApiBaseUrl);
    restoreEnvValue(
      "ANALYTICS_INGRESS_API_KEY",
      originalAnalyticsIngressApiKey,
    );
    restoreEnvValue(
      "ANALYTICS_INGRESS_API_KEY_HEADER",
      originalAnalyticsIngressApiKeyHeader,
    );
    restoreEnvValue("ANALYTICS_ENVIRONMENT", originalAnalyticsEnvironment);
    restoreEnvValue("ANALYTICS_PROJECT_ID", originalAnalyticsProjectId);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("does not emit when no ingress URL is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { emitAnalyticsEvent } = await import("@/lib/analytics/emitter");
    await emitAnalyticsEvent({
      eventName: "journey.registration.entered",
      source: "registry-journey",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("posts canonical analytics payloads with configured ingress headers", async () => {
    process.env.ANALYTICS_INGRESS_URL = "https://analytics.example";
    process.env.ANALYTICS_INGRESS_API_KEY = "secret-key";
    process.env.ANALYTICS_INGRESS_API_KEY_HEADER = "x-api-key";

    const fetchMock = vi.fn(async () => new Response("ok", { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    const { emitAnalyticsEvent } = await import("@/lib/analytics/emitter");
    await emitAnalyticsEvent(
      {
        eventName: "registration.identification.succeeded",
        source: "registry-app",
        occurredAt: "2026-06-24T12:00:00.000Z",
        clientId: "registry-web",
        identityId: "identity-123",
        sessionId: "session-123",
        flowId: "flow-123",
        oryFlowType: "registration",
        outcome: "succeeded",
        errorCode: "none",
        step: "identification",
        metadata: { cedulaValid: true },
      },
      { entryPath: "/register", returnUrl: "https://client.example" },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    const body = JSON.parse(options.body);

    expect(url).toBe("https://analytics.example/events");
    expect(options.headers["x-api-key"]).toBe("secret-key");
    expect(body).toMatchObject({
      schemaVersion: 1,
      eventName: "registration.identification.succeeded",
      environment: "dev",
      projectId: "registry-dev",
      clientId: "registry-web",
      linkageStatus: "linked",
      returnUrl: "https://client.example",
      identityId: "identity-123",
      sessionId: "session-123",
      flowId: "flow-123",
      oryFlowType: "registration",
      outcome: "succeeded",
      errorCode: "none",
      step: "identification",
      metadata: { cedulaValid: true },
    });
  });

  test("rejects unsupported event names before resolving context", async () => {
    process.env.ANALYTICS_INGRESS_URL = "https://analytics.example/events";

    const { emitAnalyticsEvent } = await import("@/lib/analytics/emitter");

    await expect(
      emitAnalyticsEvent({
        eventName: "journey.unsupported",
        source: "registry-journey",
      }),
    ).rejects.toThrow("Unsupported analytics event");
    expect(nextHeadersMocks.cookies).not.toHaveBeenCalled();
  });

  test("logs rejected and failed ingress delivery without throwing", async () => {
    process.env.ANALYTICS_INGRESS_URL = "https://analytics.example/events";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("bad request", {
          status: 400,
        }),
      )
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { emitAnalyticsEvent } = await import("@/lib/analytics/emitter");

    await expect(
      emitAnalyticsEvent({
        eventName: "support.help.opened",
        source: "registry-journey",
      }),
    ).resolves.toBeUndefined();
    await expect(
      emitAnalyticsEvent({
        eventName: "support.help.message_sent",
        source: "registry-journey",
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "[analytics] Ingress rejected event",
      400,
      "bad request",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "[analytics] Failed to emit event:",
      expect.any(Error),
    );
  });
});

describe("analytics journey route contract", () => {
  test("uses signed context instead of browser-provided client metadata", () => {
    const event = buildTrustedJourneyEventInput(
      {
        eventName: "journey.login.entered",
        clientId: "spoofed-client",
        linkageStatus: "unlinked",
        returnUrl: "https://attacker.example",
        identityId: "spoofed-identity",
        sessionId: "spoofed-session",
        metadata: { injected: true },
      },
      {
        journeyId: "journey-123",
        clientId: "trusted-client",
        clientName: "Supertest",
        institutionName: "Ministerio de Salud",
        linkageStatus: "linked",
        entryPath: "/login",
        issuedAt: 1,
        expiresAt: Date.now() + 1000,
        returnUrl: "https://trusted.example",
      },
    );

    expect(event.clientId).toBe("trusted-client");
    expect(event.clientName).toBe("Supertest");
    expect(event.institutionName).toBe("Ministerio de Salud");
    expect(event.linkageStatus).toBe("linked");
    expect(event.journeyId).toBe("journey-123");
    expect(event.returnUrl).toBe("https://trusted.example");
    expect(event.identityId).toBeUndefined();
    expect(event.sessionId).toBeUndefined();
    expect(event.metadata).toBeUndefined();
  });
});
