import { beforeEach, describe, expect, it, vi } from "vitest";
import { API } from "@/lib/constants/api";
import type { ApiResponseError } from "@/lib/services/api-response";
import { notificationService } from "@/lib/services/notifications/notification.service";

describe("notificationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves stable API codes when updating a notification fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({
          success: false,
          code: "not_found",
          error: "not_found",
        }),
    } as Response);

    await expect(
      notificationService.updateNotification("notification-id", "read"),
    ).rejects.toMatchObject({
      name: "ApiResponseError",
      status: 404,
      code: "not_found",
      payload: {
        success: false,
        code: "not_found",
        error: "not_found",
      },
    } satisfies Partial<ApiResponseError>);
  });

  it("sends credentials and no-store cache when fetching notifications", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          notifications: [],
          unreadCount: 0,
        }),
    } as Response);

    await notificationService.getNotifications("unread");

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API.notifications}?status=unread`,
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });
});
