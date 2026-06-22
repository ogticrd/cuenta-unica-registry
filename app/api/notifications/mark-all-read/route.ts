import { NextResponse } from "next/server";
import {
  queryCitizenNotifications,
  updateCitizenNotification,
} from "@/lib/notifications/buzon-client";
import { createNotificationErrorPayload } from "@/lib/notifications/errors";
import { getAuthenticatedCitizenId } from "@/lib/notifications/server-session";
import type { NotificationMutationResponse } from "@/lib/notifications/types";

function getMutationStatus(result: NotificationMutationResponse) {
  if (result.success) {
    return 200;
  }

  if (result.code === "not_found") {
    return 404;
  }

  return 503;
}

function createMutationFailureResponse(
  result: NotificationMutationResponse,
): NotificationMutationResponse {
  if (result.success) {
    return result;
  }

  const code = result.code ?? "notification_update_failed";

  return createNotificationErrorPayload(code, {
    unavailable: result.unavailable,
  });
}

export async function POST() {
  try {
    const citizenId = await getAuthenticatedCitizenId();

    if (!citizenId) {
      return NextResponse.json(
        createNotificationErrorPayload("citizen_id_unavailable"),
        { status: 409 },
      );
    }

    const unreadNotifications = await queryCitizenNotifications({
      citizenId,
      status: "unread",
      limit: 100,
    });

    if (unreadNotifications.unavailable) {
      return NextResponse.json(
        createNotificationErrorPayload("notifications_unavailable", {
          unavailable: true,
        }),
        { status: 503 },
      );
    }

    const results = await Promise.all(
      unreadNotifications.notifications.map((notification) =>
        updateCitizenNotification({
          citizenId,
          id: notification.id,
          status: "read",
        }),
      ),
    );

    const failedResult = results.find((result) => !result.success);

    if (failedResult) {
      const payload = createMutationFailureResponse(failedResult);
      return NextResponse.json(payload, { status: getMutationStatus(payload) });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      createNotificationErrorPayload("notifications_unavailable", {
        unavailable: true,
      }),
      { status: 503 },
    );
  }
}
