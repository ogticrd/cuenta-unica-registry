import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { submitFeedback } from "@/lib/services/feedback/feedback.service";

const data = {
  cedula: "402-0061234-5",
  email: "test@example.com",
  comments: "A suggestion",
};
beforeEach(() => {
  vi.spyOn(global, "fetch");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

it("normalizes the payload and requires an explicit success response", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ success: true }));
  expect(await submitFeedback(data)).toEqual({ success: true });
  expect(fetch).toHaveBeenCalledWith(
    "/api/feedback",
    expect.objectContaining({ method: "POST" }),
  );
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({
    ...data,
    cedula: "40200612345",
    name: "",
  });
});

it("preserves the unconfigured-service error code", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({ success: false, code: "NOT_CONFIGURED" }, { status: 503 }),
  );
  expect(await submitFeedback(data)).toEqual({
    success: false,
    code: "NOT_CONFIGURED",
  });
});

it.each([
  { success: false },
  { success: "true" },
  null,
])("does not treat HTTP 200 alone as successful delivery", async (body) => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json(body));
  expect(await submitFeedback(data)).toEqual({
    success: false,
    code: "SERVER_ERROR",
  });
});

it("handles malformed responses without reporting success", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response("invalid"));
  expect(await submitFeedback(data)).toEqual({
    success: false,
    code: "SERVER_ERROR",
  });
});

it("returns a retryable network error", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
  expect(await submitFeedback(data)).toEqual({
    success: false,
    code: "NETWORK_ERROR",
  });
});
