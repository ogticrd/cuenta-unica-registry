import { NextResponse } from "next/server";
import { z } from "zod";
import {
  queryCitizenNotificationPreferences,
  updateCitizenNotificationPreferences,
} from "@/lib/notifications/buzon-client";
import { buildDefaultNotificationPreferences } from "@/lib/notifications/default-preferences";
import { createNotificationErrorPayload } from "@/lib/notifications/errors";
import { getAuthenticatedCitizenId } from "@/lib/notifications/server-session";
import type { NotificationPreference } from "@/lib/notifications/types";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TOPICS,
} from "@/lib/notifications/types";
import { parseJsonRequest } from "@/lib/services/api-response";

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
    createNotificationErrorPayload("invalid_payload", {
      preferences: defaults,
    }),
    { status: 400 },
  );
}

export async function GET() {
  try {
    const citizenId = await getAuthenticatedCitizenId();
    const defaults = buildDefaultNotificationPreferences();

    if (!citizenId) {
      return NextResponse.json(
        createNotificationErrorPayload("citizen_id_unavailable", {
          preferences: defaults,
        }),
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
      ...createNotificationErrorPayload("notifications_unavailable", {
        preferences: buildDefaultNotificationPreferences(),
        unavailable: true,
      }),
    });
  }
}

export async function PUT(request: Request) {
  try {
    const defaults = buildDefaultNotificationPreferences();
    const [citizenId, parsedBody] = await Promise.all([
      getAuthenticatedCitizenId(),
      parseJsonRequest(request, notificationPreferenceUpdateRequestSchema),
    ]);

    if (!parsedBody.success) {
      return createInvalidPayloadResponse(defaults);
    }

    if (!citizenId) {
      return NextResponse.json(
        createNotificationErrorPayload("citizen_id_unavailable", {
          preferences: [],
        }),
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
      createNotificationErrorPayload("notifications_unavailable", {
        preferences: buildDefaultNotificationPreferences(),
        unavailable: true,
      }),
      { status: 503 },
    );
  }
}
