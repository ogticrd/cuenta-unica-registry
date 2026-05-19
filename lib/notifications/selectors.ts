import type { CitizenNotification, NotificationPriority } from "./types";

export function getImportantNotifications(
  notifications: CitizenNotification[],
  limit: number,
) {
  const importantPriorities: NotificationPriority[] = ["critical", "high"];
  const important = notifications.filter((notification) =>
    importantPriorities.includes(notification.priority),
  );

  return (important.length > 0 ? important : notifications).slice(0, limit);
}
