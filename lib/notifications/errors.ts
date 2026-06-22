import type { NotificationErrorCode, NotificationErrorPayload } from "./types";

export function createNotificationErrorPayload<
  TDetails extends object = object,
>(
  code: NotificationErrorCode,
  details?: TDetails,
): NotificationErrorPayload & TDetails {
  return {
    ...(details ?? ({} as TDetails)),
    success: false,
    code,
    error: code,
  };
}
