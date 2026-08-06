import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEmitAnalyticsEvent } = vi.hoisted(() => ({
  mockEmitAnalyticsEvent: vi.fn(),
}));

const { mockGetRegistrationSession } = vi.hoisted(() => ({
  mockGetRegistrationSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/analytics/emitter", () => ({
  emitAnalyticsEvent: mockEmitAnalyticsEvent,
}));

vi.mock("@/lib/services/registration/registration-session.service", () => ({
  getRegistrationSession: mockGetRegistrationSession,
}));

import { POST } from "@/app/api/feedback/route";

function request(payload: Record<string, unknown>) {
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

const validPayload = {
  cedula: "40200612345",
  email: "ciudadano@example.com",
  name: "Ciudadano Test",
  comments: "No puedo completar la verificacion de mi cuenta.",
};

function expectedAccountId(cedula: string) {
  return `acct_${createHash("sha256")
    .update(`cedula:${cedula}`)
    .digest("hex")
    .slice(0, 32)}`;
}

describe("feedback route", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    mockEmitAnalyticsEvent.mockReset();
    mockGetRegistrationSession.mockReset();
    mockGetRegistrationSession.mockResolvedValue(null);
    delete process.env.ANALYTICS_INGRESS_URL;
    delete process.env.ANALYTICS_INGRESS_API_KEY;
    delete process.env.ANALYTICS_INGRESS_API_KEY_HEADER;
  });

  it("stores support requests before delivering redacted analytics", async () => {
    process.env.ANALYTICS_INGRESS_URL = "https://analytics.example/events";
    process.env.ANALYTICS_INGRESS_API_KEY = "support-secret";
    process.env.ANALYTICS_INGRESS_API_KEY_HEADER = "x-api-key";
    const fetchMock = vi.fn(async () => new Response("ok", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    mockEmitAnalyticsEvent.mockResolvedValueOnce(true);

    const response = await POST(request(validPayload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: true });
    expect(body.requestId).toMatch(/^feedback_/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    const supportPayload = JSON.parse(options.body);

    expect(url).toBe("https://analytics.example/support/requests");
    expect(options.headers["x-api-key"]).toBe("support-secret");
    expect(supportPayload).toEqual({
      requestId: body.requestId,
      accountId: expectedAccountId(validPayload.cedula),
      oryIdentityId: null,
      channel: "registration_report",
      message: validPayload.comments,
      contactEmail: validPayload.email,
      contactName: validPayload.name,
      registrationStep: "unknown",
    });
    expect(options.body).not.toContain(validPayload.cedula);
    expect(mockEmitAnalyticsEvent).toHaveBeenCalledWith(
      {
        eventName: "support.requested",
        source: "registry-app",
        accountId: expectedAccountId(validPayload.cedula),
        step: "support",
        outcome: "succeeded",
        metadata: {
          channel: "registration_report",
          requestId: body.requestId,
          registrationStep: "unknown",
          commentLength: validPayload.comments.length,
        },
      },
      { entryPath: "/api/feedback" },
    );
    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(
      mockEmitAnalyticsEvent.mock.invocationCallOrder[0],
    );
    expect(
      JSON.stringify(mockEmitAnalyticsEvent.mock.calls[0][0]),
    ).not.toContain(validPayload.comments);
  });

  it("returns NOT_CONFIGURED when support storage configuration is incomplete", async () => {
    process.env.ANALYTICS_INGRESS_URL = "https://analytics.example/events";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(global, "fetch");

    const response = await POST(request(validPayload));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ success: false, code: "NOT_CONFIGURED" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockEmitAnalyticsEvent).not.toHaveBeenCalled();
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      validPayload.comments,
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      validPayload.email,
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      validPayload.cedula,
    );
  });

  it("returns a handled failure and skips analytics when support storage fails", async () => {
    process.env.ANALYTICS_INGRESS_URL = "https://analytics.example/events";
    process.env.ANALYTICS_INGRESS_API_KEY = "support-secret";
    const fetchMock = vi.fn(
      async () => new Response("unavailable", { status: 503 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request(validPayload));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      success: false,
      code: "SERVER_ERROR",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockEmitAnalyticsEvent).not.toHaveBeenCalled();
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      validPayload.comments,
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      validPayload.email,
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      validPayload.cedula,
    );
  });

  it("returns a handled failure when analytics ingress delivery fails after storage", async () => {
    process.env.ANALYTICS_INGRESS_URL = "https://analytics.example/events";
    process.env.ANALYTICS_INGRESS_API_KEY = "support-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("ok", { status: 201 })),
    );
    mockEmitAnalyticsEvent.mockResolvedValueOnce(false);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request(validPayload));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      success: false,
      code: "SERVER_ERROR",
    });
    expect(mockEmitAnalyticsEvent).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      validPayload.comments,
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      validPayload.email,
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      validPayload.cedula,
    );
  });

  it("links support to the trusted registration session when available", async () => {
    process.env.ANALYTICS_INGRESS_URL = "https://analytics.example/events";
    process.env.ANALYTICS_INGRESS_API_KEY = "support-secret";
    const fetchMock = vi.fn(async () => new Response("ok", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "11111111-1111-4111-8111-111111111111",
      cedula: "40225926449",
      status: "verified",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });
    mockEmitAnalyticsEvent.mockResolvedValueOnce(true);

    const response = await POST(request(validPayload));
    const body = await response.json();

    expect(response.status).toBe(200);
    const [, supportOptions] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const supportPayload = JSON.parse(supportOptions.body as string);
    expect(supportPayload.accountId).toBe(expectedAccountId("40225926449"));
    expect(supportPayload.registrationStep).toBe("liveness");
    expect(JSON.stringify(supportPayload)).not.toContain(validPayload.cedula);
    expect(mockEmitAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: expectedAccountId("40225926449"),
        metadata: expect.objectContaining({
          requestId: body.requestId,
          registrationStep: "liveness",
        }),
      }),
      { entryPath: "/api/feedback" },
    );
    expect(mockEmitAnalyticsEvent.mock.calls[0][0].accountId).not.toBe(
      expectedAccountId(validPayload.cedula),
    );
  });

  it("redacts sensitive feedback fields from support-request analytics", async () => {
    process.env.ANALYTICS_INGRESS_URL = "https://analytics.example/events";
    process.env.ANALYTICS_INGRESS_API_KEY = "support-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("ok", { status: 201 })),
    );
    mockEmitAnalyticsEvent.mockResolvedValueOnce(true);

    const response = await POST(request(validPayload));
    const body = await response.json();
    const analyticsPayload = JSON.stringify(
      mockEmitAnalyticsEvent.mock.calls[0],
    );

    expect(response.status).toBe(200);
    expect(analyticsPayload).toContain(body.requestId);
    expect(analyticsPayload).toContain(expectedAccountId(validPayload.cedula));
    expect(analyticsPayload).toContain("registration_report");
    expect(analyticsPayload).toContain(String(validPayload.comments.length));
    expect(analyticsPayload).not.toContain(validPayload.comments);
    expect(analyticsPayload).not.toContain(validPayload.email);
    expect(analyticsPayload).not.toContain(validPayload.cedula);
    expect(analyticsPayload).not.toContain(validPayload.name);
  });
});
