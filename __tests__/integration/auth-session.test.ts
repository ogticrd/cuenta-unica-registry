import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeaders, mockToSession, mockListMySessions } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
  mockToSession: vi.fn(),
  mockListMySessions: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

vi.mock("@ory/client", () => ({
  Configuration: class Configuration {
    constructor(_options?: unknown) {}
  },
  FrontendApi: class FrontendApi {
    toSession(...args: unknown[]) {
      return mockToSession(...args);
    }
    listMySessions(...args: unknown[]) {
      return mockListMySessions(...args);
    }
  },
}));

import { GET } from "@/app/api/ory/session/route";

beforeEach(() => {
  vi.clearAllMocks();

  process.env.ORY_SDK_URL = "https://ory.example.test";
  process.env.ORY_SDK_TOKEN = "ory-token";

  mockHeaders.mockResolvedValue(
    new Headers({ cookie: "ory_session=test-session-cookie" }),
  );
});

describe("GET /api/ory/session", () => {
  it("returns authenticated session with identity and other sessions", async () => {
    mockToSession.mockResolvedValueOnce({
      data: {
        identity: {
          id: "identity-123",
          traits: { email: "user@example.com", username: "40200612345" },
          schema_id: "default",
        },
        authenticated_at: "2024-01-01T00:00:00Z",
        expires_at: "2024-01-02T00:00:00Z",
      },
    });

    mockListMySessions.mockResolvedValueOnce({
      data: [
        { id: "session-1", authenticated_at: "2024-01-01T00:00:00Z" },
        { id: "session-2", authenticated_at: "2023-12-30T00:00:00Z" },
      ],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isAuthenticated).toBe(true);
    expect(body.identity).toEqual({
      id: "identity-123",
      traits: { email: "user@example.com", username: "40200612345" },
      schema_id: "default",
    });
    expect(body.session.identity.id).toBe("identity-123");
    expect(body.otherSessions).toHaveLength(2);
    expect(mockToSession).toHaveBeenCalledWith({
      cookie: "ory_session=test-session-cookie",
    });
    expect(mockListMySessions).toHaveBeenCalledWith({
      cookie: "ory_session=test-session-cookie",
    });
  });

  it("degrades gracefully when listMySessions fails", async () => {
    mockToSession.mockResolvedValueOnce({
      data: {
        identity: {
          id: "identity-456",
          traits: { email: "user@example.com" },
          schema_id: "default",
        },
      },
    });

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockListMySessions.mockRejectedValueOnce(new Error("Ory timeout"));

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isAuthenticated).toBe(true);
    expect(body.identity.id).toBe("identity-456");
    expect(body.otherSessions).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Could not fetch other sessions"),
      expect.any(Error),
    );
  });

  it("returns isAuthenticated false when Ory returns 401", async () => {
    mockToSession.mockRejectedValueOnce({ response: { status: 401 } });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isAuthenticated).toBe(false);
    expect(mockListMySessions).not.toHaveBeenCalled();
  });

  it("returns isAuthenticated false when Ory returns 403", async () => {
    mockToSession.mockRejectedValueOnce({ response: { status: 403 } });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isAuthenticated).toBe(false);
  });

  it("returns 500 when Ory returns an unexpected error without response status", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockToSession.mockRejectedValueOnce(new Error("Network failure"));

    const response = await GET();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.isAuthenticated).toBe(false);
    expect(body.error).toBe("Failed to fetch session");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("returns 500 when Ory returns a non-401/403 error status", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockToSession.mockRejectedValueOnce({ response: { status: 502 } });

    const response = await GET();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.isAuthenticated).toBe(false);
    expect(body.error).toBe("Failed to fetch session");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("forwards browser cookies to Ory for both toSession and listMySessions", async () => {
    mockHeaders.mockResolvedValueOnce(
      new Headers({ cookie: "ory_session=abc123; csrf_token=xyz" }),
    );

    mockToSession.mockResolvedValueOnce({
      data: {
        identity: { id: "id-1", traits: {}, schema_id: "default" },
      },
    });

    mockListMySessions.mockResolvedValueOnce({ data: [] });

    await GET();

    expect(mockToSession).toHaveBeenCalledWith({
      cookie: "ory_session=abc123; csrf_token=xyz",
    });
    expect(mockListMySessions).toHaveBeenCalledWith({
      cookie: "ory_session=abc123; csrf_token=xyz",
    });
  });

  it("handles empty cookie header gracefully", async () => {
    mockHeaders.mockResolvedValueOnce(new Headers());

    mockToSession.mockRejectedValueOnce({ response: { status: 401 } });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isAuthenticated).toBe(false);
    expect(mockToSession).toHaveBeenCalledWith({ cookie: "" });
  });
});
