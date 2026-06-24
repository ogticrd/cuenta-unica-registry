import { NextResponse } from "next/server";
import { isJourneyEventName } from "@/lib/analytics/catalog";
import { getAnalyticsContext } from "@/lib/analytics/context";
import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { buildTrustedJourneyEventInput } from "@/lib/analytics/journey-event";
import type { JourneyEventRequest } from "@/lib/analytics/types";

function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: Request) {
  let body: JourneyEventRequest | null = null;

  try {
    body = (await request.json()) as JourneyEventRequest;
  } catch {
    return createErrorResponse("invalid_payload", 400);
  }

  if (!body || typeof body.eventName !== "string") {
    return createErrorResponse("invalid_payload", 400);
  }

  if (!isJourneyEventName(body.eventName)) {
    return createErrorResponse("unsupported_event", 400);
  }

  const context = (await getAnalyticsContext()) ?? undefined;

  await emitAnalyticsEvent(buildTrustedJourneyEventInput(body, context), {
    entryPath: "/api/analytics/journey",
  });

  return NextResponse.json({ success: true }, { status: 202 });
}
