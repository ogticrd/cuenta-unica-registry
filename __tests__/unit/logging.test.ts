import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRequestLogContext,
  runWithRequestLogContext,
} from "@/lib/logging/context";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";

beforeEach(() => {
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "test-project");
  vi.stubEnv("REGISTRATION_SESSION_SECRET", "logging-test-secret");
  vi.stubEnv("K_SERVICE", "cuc-test");
  vi.stubEnv("K_REVISION", "cuc-test-0001");
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("structured Cloud Logging", () => {
  it("retains browser source locations while removing origins and error messages", () => {
    const error = new Error("private-password");
    error.stack = "render@https://example.com/static/app.js:12:34";
    logger.error("Browser error", { operation: "browser.client_error" }, error);
    const line = String(vi.mocked(process.stdout.write).mock.calls[0][0]);
    expect(line).toContain("app.js:12:34");
    expect(line).not.toContain("example.com");
    expect(line).not.toContain("private-password");
  });
  it("writes one JSON argument with safe diagnostic data and omits arbitrary payloads", () => {
    const error = Object.assign(
      new Error("password=secret-password citizen 40214041176"),
      {
        config: { headers: { Authorization: "secret-access-token" } },
      },
    );
    error.stack =
      "Error: password=secret-password\n    at request (https://api.example/?key=secret-access-token)\n    at account (C:/app/account.ts:14:3)";
    const context = {
      operation: "registration.account",
      stage: "account",
      code: "ory_validation_error",
      flowId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      reason:
        "email test@example.com; citizen 40214041176; password=secret-password",
      password: "secret-password",
      response: { body: "private-data" },
    };
    logger.error("No se pudo completar la cuenta", context, error);
    const calls = vi.mocked(process.stdout.write).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(1);
    const line = String(calls[0][0]);
    expect(JSON.parse(line)).toMatchObject({
      severity: "ERROR",
      operation: "registration.account",
      errorType: "Error",
      serviceContext: { service: "cuc-test", version: "cuc-test-0001" },
    });
    expect(JSON.parse(line).flowRef).toMatch(/^[a-f0-9]{24}$/);
    for (const secret of [
      "secret-password",
      "secret-access-token",
      "private-data",
      "test@example.com",
      "40214041176",
      context.flowId,
    ]) {
      expect(line).not.toContain(secret);
    }
    expect(line.trimEnd().split("\n")).toHaveLength(1);
  });

  it("retains biometric measurements, attempt metadata and finite values", () => {
    logger.info("Resultado biométrico", {
      operation: "biometric.liveness",
      source: "vid",
      event: "rekognition_liveness_completed",
      confidence: 99.1,
      similarity: 97.5,
      attemptNumber: 2,
      retryAfterSeconds: 30,
      threshold: 90,
      upstreamStatus: Number.NaN,
    });
    expect(
      JSON.parse(String(vi.mocked(process.stdout.write).mock.calls[0][0])),
    ).toMatchObject({
      confidence: 99.1,
      similarity: 97.5,
      source: "vid",
      attemptNumber: 2,
      retryAfterSeconds: 30,
    });
    expect(
      JSON.parse(String(vi.mocked(process.stdout.write).mock.calls[0][0])),
    ).not.toHaveProperty("upstreamStatus");
  });

  it("keeps parallel request contexts isolated and correlates Cloud Run traces", async () => {
    const handler = withRequestLogging(
      "/api/test/[id]",
      async (request: Request) => {
        const operation = request.headers.get("test-operation") ?? "test";
        await new Promise((resolve) =>
          setTimeout(resolve, operation === "first" ? 10 : 0),
        );
        logger.info("Request log", { operation });
        return Response.json({ success: true });
      },
    );
    const firstTrace = "a".repeat(32);
    const secondTrace = "b".repeat(32);
    await Promise.all([
      handler(
        new Request("http://localhost/api/test/40214041176?token=secret", {
          headers: {
            "test-operation": "first",
            "x-cloud-trace-context": `${firstTrace}/123;o=1`,
            Cookie: "secret",
          },
        }),
      ),
      handler(
        new Request("http://localhost/api/test/other", {
          headers: {
            "test-operation": "second",
            traceparent: `00-${secondTrace}-1234567890abcdef-01`,
          },
        }),
      ),
    ]);
    const records = vi
      .mocked(process.stdout.write)
      .mock.calls.map(([line]) => JSON.parse(String(line)));
    const first = records.find((record) => record.operation === "first");
    const second = records.find((record) => record.operation === "second");
    expect(first["logging.googleapis.com/trace"]).toBe(
      `projects/test-project/traces/${firstTrace}`,
    );
    expect(second.traceId).toBe(secondTrace);
    expect(first["logging.googleapis.com/spanId"]).toBe("000000000000007b");
    expect(first.requestId).not.toBe(second.requestId);
    expect(JSON.stringify(records)).not.toContain("40214041176");
    expect(JSON.stringify(records)).not.toContain("secret");
  });

  it("does not alter error responses or expose bodies and cookies", async () => {
    const handler = withRequestLogging("/api/test", async () =>
      Response.json(
        { success: false, code: "unexpected_error", private: "do-not-log" },
        { status: 502, headers: { "Set-Cookie": "private-cookie=value" } },
      ),
    );
    const response = await handler();
    expect(response.status).toBe(502);
    expect(response.headers.get("set-cookie")).toBe("private-cookie=value");
    expect(await response.json()).toMatchObject({ private: "do-not-log" });
    const line = String(vi.mocked(process.stdout.write).mock.calls[0][0]);
    expect(JSON.parse(line)).toMatchObject({
      status: 502,
    });
    expect(line).not.toContain("do-not-log");
    expect(line).not.toContain("private-cookie");
  });

  it("ignores malformed trace headers and works outside a request", () => {
    const context = createRequestLogContext(
      "/vid?access_token=secret",
      new Request("http://localhost", {
        headers: {
          "x-cloud-trace-context": "invalid",
          traceparent: "also-invalid",
        },
      }),
    );
    runWithRequestLogContext(context, () =>
      logger.info("Safe", { operation: "test" }),
    );
    logger.warn("Outside request", { operation: "test" });
    const record = JSON.parse(
      String(vi.mocked(process.stdout.write).mock.calls[0][0]),
    );
    expect(record).not.toHaveProperty("traceId");
    expect(record.route).toBe("/vid");
    expect(
      JSON.parse(String(vi.mocked(process.stdout.write).mock.calls[1][0]))
        .severity,
    ).toBe("WARNING");
  });

  it.each([
    {
      environment: "production",
      configured: "",
      expected: ["INFO", "WARNING", "ERROR", "CRITICAL"],
    },
    {
      environment: "development",
      configured: "",
      expected: ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
    },
    {
      environment: "production",
      configured: "warn",
      expected: ["WARNING", "ERROR", "CRITICAL"],
    },
    { environment: "production", configured: "silent", expected: [] },
    {
      environment: "production",
      configured: "invalid",
      expected: ["INFO", "WARNING", "ERROR", "CRITICAL"],
    },
  ])("filters Pino output with $environment and LOG_LEVEL=$configured", async ({
    environment,
    configured,
    expected,
  }) => {
    vi.stubEnv("NODE_ENV", environment);
    vi.stubEnv("LOG_LEVEL", configured);
    vi.resetModules();
    const { logger: configuredLogger } = await import("@/lib/logging/logger");
    const context = { operation: "test.level" };
    configuredLogger.debug("Debug", context);
    configuredLogger.info("Info", context);
    configuredLogger.warn("Warning", context);
    configuredLogger.error("Error", context);
    configuredLogger.fatal("Critical", context);
    const records = vi
      .mocked(process.stdout.write)
      .mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(records.map((record) => record.severity)).toEqual(expected);
    for (const record of records) {
      expect(record.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(record.message).toBeTypeOf("string");
      expect(record).not.toHaveProperty("level");
      expect(record).not.toHaveProperty("msg");
    }
  });
});
