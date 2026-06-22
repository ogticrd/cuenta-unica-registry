import { describe, expect, it } from "vitest";
import { createNotificationErrorPayload } from "@/lib/notifications/errors";

describe("createNotificationErrorPayload", () => {
  it("mirrors the stable code into error", () => {
    expect(createNotificationErrorPayload("notifications_unavailable")).toEqual(
      {
        success: false,
        code: "notifications_unavailable",
        error: "notifications_unavailable",
      },
    );
  });

  it("preserves details without allowing code or error drift", () => {
    expect(
      createNotificationErrorPayload("citizen_id_unavailable", {
        notifications: [],
        unreadCount: 0,
        unavailable: true,
        code: "notifications_unavailable",
        error: "notifications_unavailable",
      }),
    ).toEqual({
      success: false,
      notifications: [],
      unreadCount: 0,
      unavailable: true,
      code: "citizen_id_unavailable",
      error: "citizen_id_unavailable",
    });
  });
});
