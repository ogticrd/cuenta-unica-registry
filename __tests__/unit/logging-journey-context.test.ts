import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAnalyticsContextCookie } from "@/lib/analytics/context";
import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import {
  getRegistrationRequestJourneyId,
  withRegistrationSessionAnalyticsContext,
} from "@/lib/analytics/registration-session-context";
import { getRequestLogContext } from "@/lib/logging/context";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";
import {
  createRegistrationSessionCookie,
  parseRegistrationSessionCookie,
} from "@/lib/services/registration/registration-session.service";

const { cookies } = vi.hoisted(() => ({ cookies: new Map<string, string>() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookies.get(name);
      return value ? { name, value } : undefined;
    },
  }),
}));

const firstJourney = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const secondJourney = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

async function signedCookie(journeyId: string, expiresAt = Date.now() + 60000) {
  return createAnalyticsContextCookie({
    journeyId,
    clientId: "__unlinked__",
    linkageStatus: "unlinked",
    entryPath: "/register",
    issuedAt: Date.now(),
    expiresAt,
  });
}

beforeEach(() => {
  cookies.clear();
  vi.stubEnv("ANALYTICS_CONTEXT_SECRET", "test-only-analytics-secret");
  vi.stubEnv("REGISTRATION_SESSION_SECRET", "test-only-registration-secret");
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("journey correlation in request logs", () => {
  it.each([
    false,
    true,
  ])("keeps the session journey when the analytics cookie changes during recovery=%s", async (recovery) => {
    vi.stubEnv("ANALYTICS_INGRESS_URL", "https://analytics.example/events");
    const fetch = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    const currentCookie = await signedCookie(secondJourney);
    cookies.set(currentCookie.name, currentCookie.value);
    const registrationCookie = createRegistrationSessionCookie(
      "40214041176",
      "verified",
      undefined,
      undefined,
      {
        journeyId: firstJourney,
        clientId: "__unlinked__",
        linkageStatus: "unlinked",
        entryPath: "/register",
        issuedAt: Date.now(),
        expiresAt: Date.now() + 60000,
      },
      recovery ? { identityId: firstJourney } : undefined,
    );
    const handler = withRequestLogging(
      "/api/registration/account",
      async (_request: Request) => {
        await emitAnalyticsEvent(
          withRegistrationSessionAnalyticsContext(
            {
              eventName: "identity.registration.failed",
              source: "registry-app",
              step: "account",
            },
            parseRegistrationSessionCookie(registrationCookie.value),
          ),
        );
        logger.error("Controlled failure", { operation: "test.registration" });
        return Response.json({ success: false }, { status: 502 });
      },
      { resolveJourneyId: getRegistrationRequestJourneyId },
    );
    const response = await handler(
      new Request("http://localhost/api/registration/account", {
        headers: {
          Cookie: `${currentCookie.name}=${currentCookie.value}; ${registrationCookie.name}=${registrationCookie.value}`,
        },
      }),
    );
    expect(response.status).toBe(502);
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).journeyId).toBe(
      firstJourney,
    );
    const records = vi
      .mocked(process.stdout.write)
      .mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(records).toHaveLength(2);
    for (const record of records) expect(record.journeyId).toBe(firstJourney);
  });

  it.each([
    "tampered",
    "expired",
  ])("falls back to the analytics cookie when the registration journey is %s", async (kind) => {
    const currentCookie = await signedCookie(secondJourney);
    const registrationCookie = createRegistrationSessionCookie(
      "40214041176",
      "verified",
      undefined,
      undefined,
      {
        journeyId: firstJourney,
        clientId: "__unlinked__",
        linkageStatus: "unlinked",
        entryPath: "/register",
        issuedAt: Date.now() - 2000,
        expiresAt: kind === "expired" ? Date.now() - 1000 : Date.now() + 60000,
      },
    );
    const handler = withRequestLogging(
      "/api/registration/account",
      async (_request: Request) => {
        logger.info("Request completed", { operation: "test.registration" });
        return Response.json({ success: true });
      },
      { resolveJourneyId: getRegistrationRequestJourneyId },
    );
    await handler(
      new Request("http://localhost/api/registration/account", {
        headers: {
          Cookie: `${currentCookie.name}=${currentCookie.value}; ${registrationCookie.name}=${registrationCookie.value}${kind === "tampered" ? "x" : ""}`,
        },
      }),
    );
    const record = JSON.parse(
      String(vi.mocked(process.stdout.write).mock.calls[0][0]),
    );
    expect(record.journeyId).toBe(secondJourney);
  });

  it("reuses a journey across requests while isolating simultaneous journeys", async () => {
    const first = await signedCookie(firstJourney);
    const second = await signedCookie(secondJourney);
    const handler = withRequestLogging(
      "/api/test",
      async (request: Request) => {
        const operation = request.headers.get("test-operation") ?? "test";
        await new Promise((resolve) =>
          setTimeout(resolve, operation === "first" ? 10 : 0),
        );
        logger.info("Request completed", { operation });
        return Response.json({ success: true });
      },
    );
    await Promise.all(
      (
        [
          ["first", first],
          ["second", second],
          ["third", first],
        ] as const
      ).map(([operation, cookie]) =>
        handler(
          new Request("http://localhost/api/test", {
            headers: {
              Cookie: `${cookie.name}=${cookie.value}`,
              "test-operation": String(operation),
            },
          }),
        ),
      ),
    );
    const records = vi
      .mocked(process.stdout.write)
      .mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(
      records.find((record) => record.operation === "first")?.journeyId,
    ).toBe(firstJourney);
    expect(
      records.find((record) => record.operation === "second")?.journeyId,
    ).toBe(secondJourney);
    expect(
      records.find((record) => record.operation === "third")?.journeyId,
    ).toBe(firstJourney);
    expect(new Set(records.map((record) => record.requestId)).size).toBe(3);
    expect(getRequestLogContext()).toBeUndefined();
    logger.info("Outside request", { operation: "outside" });
    const last = vi.mocked(process.stdout.write).mock.calls.at(-1);
    expect(JSON.parse(String(last?.[0]))).not.toHaveProperty("journeyId");
  });

  it.each([
    "missing",
    "tampered",
    "expired",
    "invalid_format",
  ])("omits %s journey cookies and ignores identifiers from the body or other headers", async (kind) => {
    const cookie = await signedCookie(
      kind === "invalid_format" ? "private@example.com" : firstJourney,
      kind === "expired" ? Date.now() - 1000 : Date.now() + 60000,
    );
    const headers = new Headers({
      "Content-Type": "application/json",
      "x-journey-id": secondJourney,
    });
    if (kind !== "missing") {
      headers.set(
        "Cookie",
        `${cookie.name}=${cookie.value}${kind === "tampered" ? "x" : ""}`,
      );
    }
    const handler = withRequestLogging(
      "/api/test",
      async (request: Request) => {
        logger.info("Request completed", { operation: "test" });
        return Response.json(await request.json());
      },
    );
    const response = await handler(
      new Request("http://localhost/api/test", {
        method: "POST",
        headers,
        body: JSON.stringify({ journeyId: secondJourney }),
      }),
    );
    expect(await response.json()).toEqual({ journeyId: secondJourney });
    const line = String(vi.mocked(process.stdout.write).mock.calls[0][0]);
    expect(JSON.parse(line)).not.toHaveProperty("journeyId");
    expect(line).not.toContain("private@example.com");
    expect(line).not.toContain(cookie.value);
  });

  it("correlates analytics events and failure logs without changing response bodies or cookies", async () => {
    vi.stubEnv("ANALYTICS_INGRESS_URL", "https://analytics.example/events");
    const fetch = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    const cookie = await signedCookie(firstJourney);
    cookies.set(cookie.name, cookie.value);
    const handler = withRequestLogging(
      "/api/test",
      async (_request: Request) => {
        await emitAnalyticsEvent({
          eventName: "journey.registration.entered",
          source: "registry-app",
          step: "identification",
        });
        logger.error("Controlled failure", { operation: "test.failure" });
        return Response.json(
          { success: false, code: "unexpected_error" },
          {
            status: 502,
            headers: { "Set-Cookie": "test-cookie=preserved; Path=/" },
          },
        );
      },
    );
    const response = await handler(
      new Request("http://localhost/api/test", {
        headers: { Cookie: `${cookie.name}=${cookie.value}` },
      }),
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("set-cookie")).toBe(
      "test-cookie=preserved; Path=/",
    );
    expect(await response.json()).toEqual({
      success: false,
      code: "unexpected_error",
    });
    const payload = JSON.parse(String(fetch.mock.calls[0][1]?.body));
    expect(payload.journeyId).toBe(firstJourney);
    const records = vi
      .mocked(process.stdout.write)
      .mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(records).toHaveLength(2);
    for (const record of records)
      expect(record.journeyId).toBe(payload.journeyId);
  });
});
