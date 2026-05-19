import { NextResponse } from "next/server";
import {
  queryCitizenNotificationPreferences,
  updateCitizenNotificationPreferences,
} from "@/lib/notifications/buzon-client";
import { buildDefaultNotificationPreferences } from "@/lib/notifications/default-preferences";
import { getAuthenticatedCitizenId } from "@/lib/notifications/server-session";
import type { NotificationPreference } from "@/lib/notifications/types";

export async function GET() {
  try {
    const citizenId = await getAuthenticatedCitizenId();
    const defaults = buildDefaultNotificationPreferences();

    if (!citizenId) {
      return NextResponse.json(
        { preferences: defaults, error: "citizen_id_unavailable" },
        { status: 409 },
      );
    }

    const result = await queryCitizenNotificationPreferences({
      citizenId,
      defaults,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({
      preferences: buildDefaultNotificationPreferences(),
      unavailable: true,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const [citizenId, body] = await Promise.all([
      getAuthenticatedCitizenId(),
      request.json() as Promise<{ preferences?: NotificationPreference[] }>,
    ]);

    if (!citizenId) {
      return NextResponse.json(
        { preferences: [], error: "citizen_id_unavailable" },
        { status: 409 },
      );
    }

    const result = await updateCitizenNotificationPreferences({
      citizenId,
      preferences: body.preferences ?? [],
      defaults: buildDefaultNotificationPreferences(),
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        preferences: buildDefaultNotificationPreferences(),
        unavailable: true,
      },
      { status: 503 },
    );
  }
}
