import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { onRequestError } from "@/instrumentation";

beforeEach(() => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "test-project");
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("captures Next.js server failures using route templates and trace headers only", async () => {
  await onRequestError(
    new Error("do-not-log-this-message"),
    {
      path: "/vid?access_token=secret",
      method: "POST",
      headers: {
        cookie: "secret-cookie",
        authorization: "Bearer secret",
        "x-cloud-trace-context": `${"a".repeat(32)}/123;o=1`,
      },
    },
    {
      routerKind: "App Router",
      routePath: "/api/test/[id]",
      routeType: "route",
      revalidateReason: undefined,
    },
  );
  const line = String(vi.mocked(process.stdout.write).mock.calls[0][0]);
  expect(JSON.parse(line)).toMatchObject({
    operation: "next.request_error",
    route: "/api/test/[id]",
    stage: "route",
  });
  expect(line).not.toContain("secret");
  expect(line).not.toContain("do-not-log-this-message");
});

it("avoids importing the Node logger in an Edge runtime", async () => {
  vi.stubEnv("NEXT_RUNTIME", "edge");
  await onRequestError(
    new Error("edge"),
    { path: "/", method: "GET", headers: {} },
    {
      routerKind: "App Router",
      routePath: "/",
      routeType: "render",
      revalidateReason: undefined,
    },
  );
  expect(process.stdout.write).not.toHaveBeenCalled();
});
