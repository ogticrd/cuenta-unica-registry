import { NextResponse } from "next/server";
import { z } from "zod";
import {
  queryCitizenNotificationPreferences,
  updateCitizenNotificationPreferences,
} from "@/lib/notifications/buzon-client";
import { buildDefaultNotificationPreferences } from "@/lib/notifications/default-preferences";
import { getAuthenticatedCitizenId } from "@/lib/notifications/server-session";
import type { NotificationPreference } from "@/lib/notifications/types";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TOPICS,
} from "@/lib/notifications/types";

const notificationPreferenceUpdateRequestSchema = z.object({
  preferences: z
    .array(
      z
        .object({
          topic: z.enum(NOTIFICATION_TOPICS),
          channel: z.enum(NOTIFICATION_CHANNELS),
          enabled: z.boolean(),
          required: z.boolean().optional(),
        })
        .strict(),
    )
    .default([]),
});

function createInvalidPayloadResponse(defaults: NotificationPreference[]) {
  return NextResponse.json(
    {
      success: false,
      preferences: defaults,
      code: "invalid_payload",
      error: "invalid_payload",
    },
    { status: 400 },
  );
}

export async function GET() {
  try {
    const citizenId = await getAuthenticatedCitizenId();
    const defaults = buildDefaultNotificationPreferences();

    if (!citizenId) {
      return NextResponse.json(
        {
          success: false,
          preferences: defaults,
          code: "citizen_id_unavailable",
          error: "citizen_id_unavailable",
        },
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
      success: false,
      preferences: buildDefaultNotificationPreferences(),
      unavailable: true,
      code: "notifications_unavailable",
    });
  }
}

export async function PUT(request: Request) {
  try {
    const defaults = buildDefaultNotificationPreferences();
    const [citizenId, body] = await Promise.all([
      getAuthenticatedCitizenId(),
      request.json().catch(() => null),
    ]);
    const parsedBody =
      notificationPreferenceUpdateRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return createInvalidPayloadResponse(defaults);
    }

    if (!citizenId) {
      return NextResponse.json(
        {
          success: false,
          preferences: [],
          code: "citizen_id_unavailable",
          error: "citizen_id_unavailable",
        },
        { status: 409 },
      );
    }

    const result = await updateCitizenNotificationPreferences({
      citizenId,
      preferences: parsedBody.data.preferences.map(
        ({ topic, channel, enabled }) => ({
          topic,
          channel,
          enabled,
          required: false,
        }),
      ),
      defaults,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        success: false,
        preferences: buildDefaultNotificationPreferences(),
        unavailable: true,
        code: "notifications_unavailable",
      },
      { status: 503 },
    );
  }
}
