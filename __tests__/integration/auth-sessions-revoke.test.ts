import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeaders, mockDisableMySession } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
  mockDisableMySession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

vi.mock("@ory/client", () => ({
  Configuration: class Configuration {},
  FrontendApi: class FrontendApi {
    disableMySession(...args: unknown[]) {
      return mockDisableMySession(...args);
    }
  },
}));

import { DELETE } from "@/app/api/ory/sessions/[id]/route";

beforeEach(() => {
  vi.clearAllMocks();

  process.env.ORY_SDK_URL = "https://ory.example.test";
  process.env.ORY_SDK_TOKEN = "ory-token";

  mockHeaders.mockResolvedValue(
    new Headers({ cookie: "ory_session=test-session-cookie" }),
  );
});

describe("DELETE /api/ory/sessions/[id]", () => {
  it("revokes a session by id and returns success", async () => {
    mockDisableMySession.mockResolvedValueOnce({ data: {} });

    const request = new Request(
      "http://localhost/api/ory/sessions/session-123",
      {
        method: "DELETE",
      },
    );
    const context = { params: Promise.resolve({ id: "session-123" }) };

    const response = await DELETE(request, context);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true });
    expect(mockDisableMySession).toHaveBeenCalledWith({
      id: "session-123",
      cookie: "ory_session=test-session-cookie",
    });
  });

  it("returns 400 when session id is missing", async () => {
    const request = new Request("http://localhost/api/ory/sessions/", {
      method: "DELETE",
    });
    const context = { params: Promise.resolve({ id: "" }) };

    const response = await DELETE(request, context);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Session ID is required" });
    expect(mockDisableMySession).not.toHaveBeenCalled();
  });

  it("returns 500 when Ory fails to disable the session", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockDisableMySession.mockRejectedValueOnce(new Error("Ory internal error"));

    const request = new Request(
      "http://localhost/api/ory/sessions/session-456",
      {
        method: "DELETE",
      },
    );
    const context = { params: Promise.resolve({ id: "session-456" }) };

    const response = await DELETE(request, context);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Failed to disable session" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error disabling session"),
      expect.any(Error),
    );
  });

  it("forwards the full browser cookie string to Ory", async () => {
    mockHeaders.mockResolvedValueOnce(
      new Headers({ cookie: "ory_session=abc; csrf_token=xyz" }),
    );

    mockDisableMySession.mockResolvedValueOnce({ data: {} });

    const request = new Request(
      "http://localhost/api/ory/sessions/session-789",
      {
        method: "DELETE",
      },
    );
    const context = { params: Promise.resolve({ id: "session-789" }) };

    await DELETE(request, context);

    expect(mockDisableMySession).toHaveBeenCalledWith({
      id: "session-789",
      cookie: "ory_session=abc; csrf_token=xyz",
    });
  });

  it("handles empty cookie header gracefully", async () => {
    mockHeaders.mockResolvedValueOnce(new Headers());

    mockDisableMySession.mockRejectedValueOnce({
      response: { status: 401 },
    });

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const request = new Request(
      "http://localhost/api/ory/sessions/session-000",
      {
        method: "DELETE",
      },
    );
    const context = { params: Promise.resolve({ id: "session-000" }) };

    const response = await DELETE(request, context);

    expect(mockDisableMySession).toHaveBeenCalledWith({
      id: "session-000",
      cookie: "",
    });
    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
