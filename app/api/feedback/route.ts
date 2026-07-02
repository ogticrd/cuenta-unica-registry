import { NextResponse } from "next/server";
import { feedbackApiPayloadSchema } from "@/lib/schemas/feedback/feedback.schema";

export async function POST(request: Request) {
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
      console.info(
        "[api/feedback] endpoint not configured, payload:",
        parsed.data,
      );
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const response = await fetch(FEEDBACK_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      console.error(
        `[api/feedback] external server responded with ${response.status}`,
      );
      return NextResponse.json(
        { success: false, code: "SERVER_ERROR" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[api/feedback] network/internal error:", error);
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
