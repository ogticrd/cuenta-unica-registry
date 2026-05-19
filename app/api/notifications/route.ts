import { NextResponse } from "next/server";
import { queryCitizenNotifications } from "@/lib/notifications/buzon-client";
import { getAuthenticatedCitizenId } from "@/lib/notifications/server-session";
import type { NotificationStatus } from "@/lib/notifications/types";

function parseStatus(request: Request): NotificationStatus | undefined {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  if (status === "unread" || status === "read" || status === "archived") {
    return status;
  }

  return undefined;
}

export async function GET(request: Request) {
  try {
    const citizenId = await getAuthenticatedCitizenId();

    if (!citizenId) {
      return NextResponse.json(
        { notifications: [], unreadCount: 0, error: "citizen_id_unavailable" },
        { status: 409 },
      );
    }

    const result = await queryCitizenNotifications({
      citizenId,
      status: parseStatus(request),
      limit: 50,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { notifications: [], unreadCount: 0, unavailable: true },
      { status: 200 },
    );
  }
}
