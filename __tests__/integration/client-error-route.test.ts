import { afterEach, beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});
afterEach(() => vi.restoreAllMocks());

function request(body: unknown, origin = "http://localhost") {
  return new Request("http://localhost/api/observability/client-errors", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "Sec-Fetch-Site": "same-origin",
    },
    body: JSON.stringify(body),
  });
}

it("accepts a safe event and labels it as untrusted browser telemetry", async () => {
  const { POST } = await import("@/app/api/observability/client-errors/route");
  const response = await POST(
    request({
      event: "form_error",
      form: "verification",
      code: "invalid_code",
      messageIds: [4000001],
    }),
  );
  expect(response.status).toBe(204);
  expect(
    JSON.parse(String(vi.mocked(process.stdout.write).mock.calls[0][0])),
  ).toMatchObject({
    origin: "browser",
    form: "verification",
    code: "invalid_code",
    messageIds: [4000001],
  });
});

it.each([
  { event: "client_error", password: "secret" },
  { event: "client_error", cedula: "40214041176" },
  { event: "client_error", code: "arbitrary-user-data" },
  { event: "unknown_event" },
])("rejects unsupported fields or arbitrary data without logging it: %j", async (body) => {
  const { POST } = await import("@/app/api/observability/client-errors/route");
  expect((await POST(request(body))).status).toBe(400);
  expect(process.stdout.write).not.toHaveBeenCalled();
});

it("rejects other origins and oversized requests before writing a log", async () => {
  const { POST } = await import("@/app/api/observability/client-errors/route");
  expect(
    (await POST(request({ event: "client_error" }, "https://other.example")))
      .status,
  ).toBe(403);
  expect(
    (await POST(request({ event: "client_error", extra: "a".repeat(3000) })))
      .status,
  ).toBe(413);
  expect(process.stdout.write).not.toHaveBeenCalled();
});

it("caps accepted reports per instance and does not log rejected excess requests", async () => {
  const { POST } = await import("@/app/api/observability/client-errors/route");
  for (let index = 0; index < 120; index++) {
    expect((await POST(request({ event: "client_error" }))).status).toBe(204);
  }
  const response = await POST(request({ event: "client_error" }));
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("60");
  expect(process.stdout.write).toHaveBeenCalledTimes(120);
});
