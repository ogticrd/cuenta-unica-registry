import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeaders, mockToSession } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
  mockToSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: mockHeaders,
}));

vi.mock("@ory/client", () => ({
  Configuration: class Configuration {},
  FrontendApi: class FrontendApi {
    toSession(...args: unknown[]) {
      return mockToSession(...args);
    }
  },
}));

import { PATCH } from "@/app/api/notifications/[id]/route";
import { POST as markAllRead } from "@/app/api/notifications/mark-all-read/route";
import {
  GET as GETPreferences,
  PUT as PUTPreferences,
} from "@/app/api/notifications/preferences/route";
import { GET } from "@/app/api/notifications/route";

function buildNotification(overrides: Record<string, unknown>) {
  const id = String(overrides.id ?? "notification-id");

  return {
    id,
    notificationId: `event-${id}`,
    topic: "security",
    priority: "normal",
    title: id,
    message: id,
    status: "unread",
    channels: ["portal"],
    actionLabel: null,
    actionUrl: null,
    metadata: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    readAt: null,
    archivedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();

  process.env.ORY_SDK_URL = "https://ory.example.test";
  process.env.BUZON_API_BASE_URL = "https://buzon.example.test";
  process.env.BUZON_PORTAL_API_KEY = "portal-key";

  mockHeaders.mockResolvedValue(
    new Headers({ cookie: "ory_session=test-session-cookie" }),
  );
  mockToSession.mockResolvedValue({
    data: {
      identity: {
        id: "identity-123",
        traits: { username: "402-0061234-5" },
      },
    },
  });
});

describe("GET /api/notifications", () => {
  it("queries Buzon with the citizen id in the server-to-server body", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          notifications: [],
          unreadCount: 0,
        }),
    } as Response);

    const response = await GET(
      new Request("http://localhost/api/notifications?status=unread"),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://buzon.example.test/api/v1/inbox/query",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer portal-key",
        }),
        body: expect.stringContaining('"citizenId":"40200612345"'),
      }),
    );
  });

  it("filters the CUC channel inbox to account and security topics", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          notifications: [
            buildNotification({ id: "security", topic: "security" }),
            buildNotification({ id: "account", topic: "account" }),
            buildNotification({ id: "appointment", topic: "appointments" }),
          ],
          unreadCount: 3,
        }),
    } as Response);

    const response = await GET(
      new Request("http://localhost/api/notifications"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(
      payload.notifications.map(
        (notification: { id: string }) => notification.id,
      ),
    ).toEqual(["security", "account"]);
    expect(payload.unreadCount).toBe(2);
  });

  it("degrades to an empty inbox when Buzon is not configured", async () => {
    delete process.env.BUZON_API_BASE_URL;
    delete process.env.BUZON_PORTAL_API_KEY;

    const response = await GET(
      new Request("http://localhost/api/notifications"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: false,
      notifications: [],
      unreadCount: 0,
      unavailable: true,
      code: "notifications_unavailable",
      error: "notifications_unavailable",
    });
  });

  it("returns a stable code when the authenticated citizen id is unavailable", async () => {
    mockToSession.mockResolvedValueOnce({
      data: {
        identity: {
          id: "identity-123",
          traits: {},
        },
      },
    });

    const response = await GET(
      new Request("http://localhost/api/notifications"),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      success: false,
      notifications: [],
      unreadCount: 0,
      code: "citizen_id_unavailable",
      error: "citizen_id_unavailable",
    });
  });
});

describe("GET /api/notifications/preferences", () => {
  it("filters Buzon preferences to the Cuenta Unica account and security scope", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          preferences: [
            {
              topic: "security",
              channel: "portal",
              enabled: true,
              required: true,
            },
            {
              topic: "account",
              channel: "portal",
              enabled: true,
              required: false,
            },
            {
              topic: "appointments",
              channel: "portal",
              enabled: true,
              required: false,
            },
          ],
        }),
    } as Response);

    const response = await GETPreferences();
    const payload = await response.json();
    const topics = [
      ...new Set(
        payload.preferences.map(
          (preference: { topic: string }) => preference.topic,
        ),
      ),
    ];

    expect(response.status).toBe(200);
    expect(topics).toEqual(["security", "account"]);
    expect(payload.preferences).toHaveLength(8);
  });

  it("returns a stable code when notification preferences are unavailable", async () => {
    delete process.env.BUZON_API_BASE_URL;
    delete process.env.BUZON_PORTAL_API_KEY;

    const response = await GETPreferences();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: false,
      unavailable: true,
      code: "notifications_unavailable",
      error: "notifications_unavailable",
    });
  });

  it("returns a stable code when the authenticated citizen id is unavailable", async () => {
    mockToSession.mockResolvedValueOnce({
      data: {
        identity: {
          id: "identity-123",
          traits: {},
        },
      },
    });

    const response = await GETPreferences();

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      success: false,
      code: "citizen_id_unavailable",
      error: "citizen_id_unavailable",
    });
  });

  it("returns a stable code when preference updates are unauthenticated", async () => {
    mockToSession.mockResolvedValueOnce({
      data: {
        identity: {
          id: "identity-123",
          traits: {},
        },
      },
    });

    const response = await PUTPreferences(
      new Request("http://localhost/api/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: [] }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      success: false,
      preferences: [],
      code: "citizen_id_unavailable",
      error: "citizen_id_unavailable",
    });
  });

  it("returns invalid_payload when preference updates contain malformed JSON", async () => {
    const response = await PUTPreferences(
      new Request("http://localhost/api/notifications/preferences", {
        method: "PUT",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      code: "invalid_payload",
      error: "invalid_payload",
    });
  });

  it("returns invalid_payload when preference updates do not match the contract", async () => {
    const response = await PUTPreferences(
      new Request("http://localhost/api/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify({
          preferences: [
            {
              topic: "security",
              channel: "portal",
              enabled: "yes",
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      code: "invalid_payload",
      error: "invalid_payload",
    });
  });

  it("does not trust client-provided required preference flags", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            preferences: [
              {
                topic: "security",
                channel: "portal",
                enabled: true,
                required: true,
              },
            ],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            preferences: [
              {
                topic: "security",
                channel: "portal",
                enabled: false,
                required: true,
              },
            ],
          }),
      } as Response);

    const response = await PUTPreferences(
      new Request("http://localhost/api/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify({
          preferences: [
            {
              topic: "security",
              channel: "portal",
              enabled: false,
              required: false,
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenLastCalledWith(
      "https://buzon.example.test/api/v1/preferences",
      expect.objectContaining({
        method: "PUT",
        body: expect.not.stringContaining("required"),
      }),
    );
  });
});

describe("PATCH /api/notifications/[id]", () => {
  it("returns invalid_payload for malformed JSON bodies", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/notifications/security", {
        method: "PATCH",
        body: "not-json",
      }),
      { params: Promise.resolve({ id: "security" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      code: "invalid_payload",
      error: "invalid_payload",
    });
  });

  it("returns a stable code for invalid status payloads", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/notifications/security", {
        method: "PATCH",
        body: JSON.stringify({ status: "deleted" }),
      }),
      { params: Promise.resolve({ id: "security" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      code: "invalid_status",
      error: "invalid_status",
    });
  });

  it("does not mutate out-of-scope Buzon topics from the Cuenta Unica channel", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          notifications: [
            buildNotification({ id: "appointment", topic: "appointments" }),
          ],
          unreadCount: 1,
        }),
    } as Response);

    const response = await PATCH(
      new Request("http://localhost/api/notifications/appointment", {
        method: "PATCH",
        body: JSON.stringify({ status: "read" }),
      }),
      { params: Promise.resolve({ id: "appointment" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({
      success: false,
      code: "not_found",
      error: "not_found",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://buzon.example.test/api/v1/inbox/query",
      expect.objectContaining({
        body: expect.stringContaining('"recipientId":"appointment"'),
      }),
    );
  });

  it("mutates account and security notifications after the server-side scope check", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            notifications: [
              buildNotification({ id: "security", topic: "security" }),
            ],
            unreadCount: 1,
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

    const response = await PATCH(
      new Request("http://localhost/api/notifications/security", {
        method: "PATCH",
        body: JSON.stringify({ status: "read" }),
      }),
      { params: Promise.resolve({ id: "security" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenLastCalledWith(
      "https://buzon.example.test/api/v1/inbox/security",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });
});

describe("POST /api/notifications/mark-all-read", () => {
  it("returns a stable code when Buzon is unavailable", async () => {
    delete process.env.BUZON_API_BASE_URL;
    delete process.env.BUZON_PORTAL_API_KEY;

    const response = await markAllRead();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      unavailable: true,
      code: "notifications_unavailable",
      error: "notifications_unavailable",
    });
  });

  it("returns a stable code when one notification cannot be updated", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            notifications: [
              buildNotification({ id: "security", topic: "security" }),
            ],
            unreadCount: 1,
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            notifications: [
              buildNotification({ id: "security", topic: "security" }),
            ],
            unreadCount: 1,
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            code: "notification_update_failed",
          }),
      } as Response);

    const response = await markAllRead();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      code: "notification_update_failed",
      error: "notification_update_failed",
    });
  });
});
