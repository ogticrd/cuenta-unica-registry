export const NOTIFICATION_CHANNELS = [
  "portal",
  "email",
  "sms",
  "whatsapp",
] as const;

export const NOTIFICATION_TOPICS = [
  "security",
  "legal",
  "public_services",
  "appointments",
  "payments",
  "account",
] as const;

export const CUENTA_UNICA_NOTIFICATION_TOPICS = [
  "security",
  "account",
] as const;

export const NOTIFICATION_STATUSES = ["unread", "read", "archived"] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number];
export type CuentaUnicaNotificationTopic =
  (typeof CUENTA_UNICA_NOTIFICATION_TOPICS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface CitizenNotification {
  id: string;
  notificationId: string;
  topic: NotificationTopic;
  priority: NotificationPriority;
  title: string;
  message: string;
  status: NotificationStatus;
  channels: NotificationChannel[];
  actionLabel: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
}

export interface NotificationPreference {
  topic: NotificationTopic;
  channel: NotificationChannel;
  enabled: boolean;
  required: boolean;
}

export interface NotificationsResponse {
  notifications: CitizenNotification[];
  unreadCount: number;
  unavailable?: boolean;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
  unavailable?: boolean;
}

export interface NotificationMutationResponse {
  success: boolean;
  unavailable?: boolean;
  error?: string;
}
