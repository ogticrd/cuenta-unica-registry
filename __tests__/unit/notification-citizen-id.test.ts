import { describe, expect, it } from "vitest";
import {
  getCitizenIdFromSession,
  normalizeCitizenId,
} from "@/lib/notifications/citizen-id";
import { buildDefaultNotificationPreferences } from "@/lib/notifications/default-preferences";
import { getImportantNotifications } from "@/lib/notifications/selectors";
import type { CitizenNotification } from "@/lib/notifications/types";

describe("notification citizen id", () => {
  it("normalizes cedula values", () => {
    expect(normalizeCitizenId("402-0061234-5")).toBe("40200612345");
  });

  it("returns null for invalid values", () => {
    expect(normalizeCitizenId("123")).toBeNull();
  });

  it("extracts the citizen id from Ory username traits", () => {
    const session = {
      identity: {
        traits: {
          username: "402-0061234-5",
        },
      },
    };

    expect(getCitizenIdFromSession(session as never)).toBe("40200612345");
  });
});

describe("notification preferences", () => {
  it("only exposes account and security topics for Cuenta Unica", () => {
    const preferences = buildDefaultNotificationPreferences();
    const topics = [
      ...new Set(preferences.map((preference) => preference.topic)),
    ];

    expect(topics).toEqual(["security", "account"]);
  });

  it("enables portal by default and leaves external channels opt-in", () => {
    const preferences = buildDefaultNotificationPreferences();

    expect(
      preferences.find(
        (preference) =>
          preference.topic === "account" && preference.channel === "portal",
      )?.enabled,
    ).toBe(true);
    expect(
      preferences.find(
        (preference) =>
          preference.topic === "account" && preference.channel === "whatsapp",
      )?.enabled,
    ).toBe(false);
  });

  it("keeps security portal preferences required", () => {
    const preferences = buildDefaultNotificationPreferences();

    expect(
      preferences.find(
        (preference) =>
          preference.topic === "security" && preference.channel === "portal",
      ),
    ).toMatchObject({ enabled: true, required: true });
  });

  it("keeps account portal preferences optional", () => {
    const preferences = buildDefaultNotificationPreferences();

    expect(
      preferences.find(
        (preference) =>
          preference.topic === "account" && preference.channel === "portal",
      ),
    ).toMatchObject({ enabled: true, required: false });
  });
});

describe("important notifications selector", () => {
  it("prioritizes high and critical notifications", () => {
    const notifications = [
      { id: "normal", priority: "normal" },
      { id: "critical", priority: "critical" },
    ].map(
      (notification) =>
        ({
          ...notification,
          notificationId: notification.id,
          topic: "account",
          title: notification.id,
          message: notification.id,
          status: "unread",
          channels: ["portal"],
          actionLabel: null,
          actionUrl: null,
          metadata: {},
          createdAt: "2026-01-01T00:00:00.000Z",
          readAt: null,
          archivedAt: null,
        }) as CitizenNotification,
    );

    expect(getImportantNotifications(notifications, 1)[0]?.id).toBe("critical");
  });
});
