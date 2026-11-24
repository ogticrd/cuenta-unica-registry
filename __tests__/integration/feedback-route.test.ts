import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/feedback/route";

const payload = {
  cedula: "40200612345",
  email: "test@example.com",
  name: "Test",
  comments: "A test suggestion",
};
const request = (body: unknown = payload) =>
  new Request("http://localhost/api/feedback", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  vi.stubEnv("FEEDBACK_API_URL", "https://feedback.example/reports");
  vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(null, { status: 204 }),
  );
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("feedback delivery", () => {
  it("does not report success when no destination is configured", async () => {
    vi.stubEnv("FEEDBACK_API_URL", "");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      code: "NOT_CONFIGURED",
    });
    expect(fetch).not.toHaveBeenCalled();
    const logs = JSON.stringify(vi.mocked(process.stdout.write).mock.calls);
    for (const value of Object.values(payload))
      expect(logs).not.toContain(value);
  });

  it.each([
    {},
    { ...payload, cedula: "bad" },
    { ...payload, email: "bad" },
  ])("rejects invalid feedback before contacting the provider", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with a client error", async () => {
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: "{",
      }),
    );
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports a provider rejection instead of acknowledging delivery", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      success: false,
      code: "SERVER_ERROR",
    });
  });

  it("reports a network failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    expect((await POST(request())).status).toBe(500);
  });

  it("acknowledges feedback after the destination accepts it", async () => {
    const response = await POST(request());
    expect(await response.json()).toEqual({ success: true });
    expect(fetch).toHaveBeenCalledWith(
      "https://feedback.example/reports",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        cache: "no-store",
      }),
    );
  });
});
