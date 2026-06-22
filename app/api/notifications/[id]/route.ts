import { NextResponse } from "next/server";
import { z } from "zod";
import { updateCitizenNotification } from "@/lib/notifications/buzon-client";
import { getAuthenticatedCitizenId } from "@/lib/notifications/server-session";
import type { NotificationMutationResponse } from "@/lib/notifications/types";
import { NOTIFICATION_STATUSES } from "@/lib/notifications/types";

const notificationStatusRequestSchema = z.object({
  status: z.enum(NOTIFICATION_STATUSES),
});

function getMutationStatus(result: NotificationMutationResponse) {
  if (result.success) {
    return 200;
  }

  if (result.code === "not_found") {
    return 404;
  }

  return 503;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [{ id }, bodyResult] = await Promise.all([
      params,
      request
        .json()
        .then((data) => ({ success: true as const, data }))
        .catch(() => ({ success: false as const })),
    ]);

    if (!bodyResult.success) {
      return NextResponse.json(
        { success: false, code: "invalid_payload", error: "invalid_payload" },
        { status: 400 },
      );
    }

    const parsedBody = notificationStatusRequestSchema.safeParse(
      bodyResult.data,
    );

    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, code: "invalid_status", error: "invalid_status" },
        { status: 400 },
      );
    }

    const citizenId = await getAuthenticatedCitizenId();

    if (!citizenId) {
      return NextResponse.json(
        {
          success: false,
          code: "citizen_id_unavailable",
          error: "citizen_id_unavailable",
        },
        { status: 409 },
      );
    }

    const result = await updateCitizenNotification({
      citizenId,
      id,
      status: parsedBody.data.status,
    });
    return NextResponse.json(result, { status: getMutationStatus(result) });
  } catch {
    return NextResponse.json(
      {
        success: false,
        unavailable: true,
        code: "notifications_unavailable",
      },
      { status: 503 },
    );
  }
}
