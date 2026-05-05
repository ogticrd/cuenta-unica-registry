import { NextResponse } from "next/server";
import { updateCitizenNotification } from "@/lib/notifications/buzon-client";
import { getAuthenticatedCitizenId } from "@/lib/notifications/server-session";
import type { NotificationStatus } from "@/lib/notifications/types";

function parseStatus(value: unknown): NotificationStatus | null {
  if (value === "unread" || value === "read" || value === "archived") {
    return value;
  }

  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [{ id }, body, citizenId] = await Promise.all([
      params,
      request.json() as Promise<{ status?: unknown }>,
      getAuthenticatedCitizenId(),
    ]);
    const status = parseStatus(body.status);

    if (!status) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }

    if (!citizenId) {
      return NextResponse.json(
        { success: false, error: "citizen_id_unavailable" },
        { status: 409 },
      );
    }

    const result = await updateCitizenNotification({ citizenId, id, status });
    return NextResponse.json(result, { status: result.success ? 200 : 503 });
  } catch {
    return NextResponse.json(
      { success: false, unavailable: true },
      { status: 503 },
    );
  }
}
