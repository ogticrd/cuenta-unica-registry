import type {
  CitizenNotification,
  NotificationMutationResponse,
  NotificationPreference,
  NotificationPreferencesResponse,
  NotificationStatus,
  NotificationsResponse,
} from "./types";
import { CUENTA_UNICA_NOTIFICATION_TOPICS } from "./types";

type BuzonRequestOptions = {
  path: string;
  method?: "POST" | "PATCH" | "PUT";
  body: Record<string, unknown>;
};

const cuentaUnicaTopicSet = new Set<string>(CUENTA_UNICA_NOTIFICATION_TOPICS);

function isCuentaUnicaNotificationTopic(topic: string) {
  return cuentaUnicaTopicSet.has(topic);
}

function filterCuentaUnicaNotifications(notifications: CitizenNotification[]) {
  return notifications.filter((notification) =>
    isCuentaUnicaNotificationTopic(notification.topic),
  );
}

function getUnreadCount(notifications: CitizenNotification[]) {
  return notifications.filter(
    (notification) => notification.status === "unread",
  ).length;
}

function buildCuentaUnicaNotificationsResponse(
  result: NotificationsResponse,
): NotificationsResponse {
  const notifications = filterCuentaUnicaNotifications(result.notifications);

  return {
    ...result,
    notifications,
    unreadCount: getUnreadCount(notifications),
  };
}

function buildPreferenceKey(
  preference: Pick<NotificationPreference, "topic" | "channel">,
) {
  return `${preference.topic}:${preference.channel}`;
}

function buildCuentaUnicaPreferencesResponse(
  preferences: NotificationPreference[],
  defaults: NotificationPreference[],
): NotificationPreference[] {
  const preferenceMap = new Map(
    preferences
      .filter((preference) => isCuentaUnicaNotificationTopic(preference.topic))
      .map((preference) => [buildPreferenceKey(preference), preference]),
  );

  return defaults.map((defaultPreference) => {
    const preference = preferenceMap.get(buildPreferenceKey(defaultPreference));

    if (!preference) {
      return defaultPreference;
    }

    return {
      ...defaultPreference,
      enabled: defaultPreference.required
        ? defaultPreference.enabled
        : preference.enabled,
    };
  });
}

function mergeCuentaUnicaPreferenceUpdates(
  currentPreferences: NotificationPreference[],
  updates: NotificationPreference[],
) {
  const nextPreferenceMap = new Map(
    currentPreferences.map((preference) => [
      buildPreferenceKey(preference),
      preference,
    ]),
  );

  for (const update of updates) {
    if (!isCuentaUnicaNotificationTopic(update.topic)) {
      continue;
    }

    nextPreferenceMap.set(buildPreferenceKey(update), {
      ...update,
      required: update.required,
    });
  }

  return [...nextPreferenceMap.values()];
}

function getBuzonConfig() {
  const baseUrl = process.env.BUZON_API_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.BUZON_PORTAL_API_KEY;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return { baseUrl, apiKey };
}

async function requestBuzon<T>({
  path,
  method = "POST",
  body,
}: BuzonRequestOptions) {
  const config = getBuzonConfig();

  if (!config) {
    return { data: null, unavailable: true };
  }

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      return { data: null, unavailable: true };
    }

    return { data: (await response.json()) as T, unavailable: false };
  } catch {
    return { data: null, unavailable: true };
  }
}

export async function queryCitizenNotifications(input: {
  citizenId: string;
  recipientId?: string;
  status?: NotificationStatus;
  limit?: number;
}): Promise<NotificationsResponse> {
  const result = await requestBuzon<NotificationsResponse>({
    path: "/api/v1/inbox/query",
    body: {
      citizenId: input.citizenId,
      recipientId: input.recipientId,
      status: input.status,
      limit: input.limit ?? 25,
    },
  });

  if (!result.data) {
    return {
      notifications: [],
      unreadCount: 0,
      unavailable: result.unavailable,
    };
  }

  return buildCuentaUnicaNotificationsResponse(result.data);
}

export async function updateCitizenNotification(input: {
  citizenId: string;
  id: string;
  status: NotificationStatus;
}): Promise<NotificationMutationResponse> {
  const current = await queryCitizenNotifications({
    citizenId: input.citizenId,
    recipientId: input.id,
    limit: 1,
  });

  if (current.unavailable) {
    return { success: false, unavailable: true };
  }

  if (current.notifications.length === 0) {
    return { success: false, error: "not_found" };
  }

  const result = await requestBuzon<NotificationMutationResponse>({
    path: `/api/v1/inbox/${input.id}`,
    method: "PATCH",
    body: {
      citizenId: input.citizenId,
      status: input.status,
    },
  });

  return result.data ?? { success: false, unavailable: result.unavailable };
}

export async function markAllCitizenNotificationsRead(input: {
  citizenId: string;
}): Promise<NotificationMutationResponse> {
  const result = await requestBuzon<NotificationMutationResponse>({
    path: "/api/v1/inbox/mark-all-read",
    body: {
      citizenId: input.citizenId,
    },
  });

  return result.data ?? { success: false, unavailable: result.unavailable };
}

export async function queryCitizenNotificationPreferences(input: {
  citizenId: string;
  defaults: NotificationPreference[];
}): Promise<NotificationPreferencesResponse> {
  const result = await requestBuzon<NotificationPreferencesResponse>({
    path: "/api/v1/preferences/query",
    body: {
      citizenId: input.citizenId,
    },
  });

  if (!result.data) {
    return { preferences: input.defaults, unavailable: result.unavailable };
  }

  return {
    preferences: buildCuentaUnicaPreferencesResponse(
      result.data.preferences,
      input.defaults,
    ),
  };
}

export async function updateCitizenNotificationPreferences(input: {
  citizenId: string;
  preferences: NotificationPreference[];
  defaults: NotificationPreference[];
}): Promise<NotificationPreferencesResponse> {
  const currentResult = await requestBuzon<NotificationPreferencesResponse>({
    path: "/api/v1/preferences/query",
    body: {
      citizenId: input.citizenId,
    },
  });

  if (!currentResult.data) {
    return {
      preferences:
        input.preferences.length > 0 ? input.preferences : input.defaults,
      unavailable: currentResult.unavailable,
    };
  }

  const preferences = mergeCuentaUnicaPreferenceUpdates(
    currentResult.data.preferences,
    input.preferences,
  );

  const result = await requestBuzon<NotificationPreferencesResponse>({
    path: "/api/v1/preferences",
    method: "PUT",
    body: {
      citizenId: input.citizenId,
      preferences: preferences.map(({ topic, channel, enabled }) => ({
        topic,
        channel,
        enabled,
      })),
    },
  });

  if (!result.data) {
    return { preferences: input.preferences, unavailable: result.unavailable };
  }

  return {
    preferences: buildCuentaUnicaPreferencesResponse(
      result.data.preferences,
      input.defaults,
    ),
  };
}
