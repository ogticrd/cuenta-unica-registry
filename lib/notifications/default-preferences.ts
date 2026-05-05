import {
  CUENTA_UNICA_NOTIFICATION_TOPICS,
  NOTIFICATION_CHANNELS,
  type NotificationPreference,
  type NotificationTopic,
} from "./types";

const REQUIRED_TOPICS = new Set<NotificationTopic>(["security"]);

export function buildDefaultNotificationPreferences(): NotificationPreference[] {
  return CUENTA_UNICA_NOTIFICATION_TOPICS.flatMap((topic) =>
    NOTIFICATION_CHANNELS.map((channel) => ({
      topic,
      channel,
      enabled: channel === "portal",
      required: REQUIRED_TOPICS.has(topic) && channel === "portal",
    })),
  );
}
