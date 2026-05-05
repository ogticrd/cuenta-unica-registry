import { API } from "@/lib/constants/api";
import type {
  NotificationMutationResponse,
  NotificationPreferencesResponse,
  NotificationStatus,
  NotificationsResponse,
} from "@/lib/notifications/types";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return payload;
}

export const notificationService = {
  getNotifications(
    status?: NotificationStatus,
  ): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }

    const path =
      params.size > 0 ? `${API.notifications}?${params}` : API.notifications;

    return fetch(path, {
      credentials: "include",
      cache: "no-store",
    }).then(parseJsonResponse<NotificationsResponse>);
  },

  updateNotification(
    id: string,
    status: NotificationStatus,
  ): Promise<NotificationMutationResponse> {
    return fetch(`${API.notifications}/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then(parseJsonResponse<NotificationMutationResponse>);
  },

  markAllRead(): Promise<NotificationMutationResponse> {
    return fetch(API.notificationsMarkAllRead, {
      method: "POST",
      credentials: "include",
    }).then(parseJsonResponse<NotificationMutationResponse>);
  },

  getPreferences(): Promise<NotificationPreferencesResponse> {
    return fetch(API.notificationPreferences, {
      credentials: "include",
      cache: "no-store",
    }).then(parseJsonResponse<NotificationPreferencesResponse>);
  },

  updatePreferences(
    preferences: NotificationPreferencesResponse["preferences"],
  ): Promise<NotificationPreferencesResponse> {
    return fetch(API.notificationPreferences, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences }),
    }).then(parseJsonResponse<NotificationPreferencesResponse>);
  },
};
