import { NextResponse } from "next/server";
import {
  queryCitizenNotifications,
  updateCitizenNotification,
} from "@/lib/notifications/buzon-client";
import { getAuthenticatedCitizenId } from "@/lib/notifications/server-session";

export async function POST() {
  try {
    const citizenId = await getAuthenticatedCitizenId();

    if (!citizenId) {
      return NextResponse.json(
        { success: false, error: "citizen_id_unavailable" },
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
        { success: false, unavailable: true },
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

    const success = results.every((result) => result.success);
    return NextResponse.json({ success }, { status: success ? 200 : 503 });
  } catch {
    return NextResponse.json(
      { success: false, unavailable: true },
      { status: 503 },
    );
  }
}
