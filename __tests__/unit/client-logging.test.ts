import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.unmock("@/lib/logging/client");

beforeEach(() => {
  vi.resetModules();
  vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(null, { status: 204 }),
  );
});
afterEach(() => vi.restoreAllMocks());

it("reports safe browser error context without cookies, raw messages or credential data", async () => {
  const { reportClientError } = await import("@/lib/logging/client");
  const error = new Error("secret-password test@example.com 40214041176");
  error.stack =
    "Error: secret-password\n    at app (https://example.com/?token=secret-password)";
  reportClientError("client_error", { form: "register" }, error);
  const [, options] = vi.mocked(fetch).mock.calls[0];
  expect(options).toMatchObject({ credentials: "omit", keepalive: true });
  expect(String(options?.body)).not.toContain("secret-password");
  expect(String(options?.body)).not.toContain("test@example.com");
  expect(String(options?.body)).not.toContain("40214041176");
  expect(JSON.parse(String(options?.body))).toMatchObject({
    event: "client_error",
    errorType: "Error",
  });
});

it("deduplicates reports and limits the number per page", async () => {
  const { reportClientError } = await import("@/lib/logging/client");
  const { clientErrorCodes } = await import("@/lib/logging/client-event");
  for (const code of clientErrorCodes.slice(0, 12)) {
    reportClientError("form_error", { code });
    reportClientError("form_error", { code });
  }
  expect(fetch).toHaveBeenCalledTimes(10);
});

it("handles reporting failures without retry loops or propagating errors", async () => {
  vi.mocked(fetch).mockRejectedValue(new Error("offline"));
  const { reportClientError } = await import("@/lib/logging/client");
  expect(() =>
    reportClientError("client_error", {}, new Error("failure")),
  ).not.toThrow();
  await Promise.resolve();
  expect(fetch).toHaveBeenCalledTimes(1);
});
