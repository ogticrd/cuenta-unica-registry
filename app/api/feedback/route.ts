import { NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";
import { feedbackApiPayloadSchema } from "@/lib/schemas/feedback/feedback.schema";

async function handlePOST(request: Request) {
  try {
    const json = await request.json();
    const parsed = feedbackApiPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    const FEEDBACK_API_URL = process.env.FEEDBACK_API_URL;

    if (!FEEDBACK_API_URL) {
      logger.warn("Feedback recibido sin destino configurado", {
        operation: "feedback.submit",
        form: "feedback",
        code: "destination_not_configured",
        hasContact: Boolean(parsed.data.email),
        commentLength: parsed.data.comments?.length,
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const response = await fetch(FEEDBACK_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      logger.error(
        `[api/feedback] external server responded with ${response.status}`,
        {
          operation: "app.api.feedback.route",
          upstreamStatus: response.status,
        },
      );
      return NextResponse.json(
        { success: false, code: "SERVER_ERROR" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error(
      "[api/feedback] network/internal error:",
      { operation: "app.api.feedback.route" },
      error,
    );
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const POST = withRequestLogging("/api/feedback", handlePOST);
