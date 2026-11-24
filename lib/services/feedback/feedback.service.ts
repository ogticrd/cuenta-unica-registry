import { z } from "zod";
import { API } from "@/lib/constants/api";
import type { FeedbackFormData } from "@/lib/schemas/feedback/feedback.schema";

export type FeedbackResult =
  | { success: true }
  | {
      success: false;
      code: "NETWORK_ERROR" | "SERVER_ERROR" | "NOT_CONFIGURED" | "BAD_REQUEST";
    };

export async function submitFeedback(
  data: FeedbackFormData,
): Promise<FeedbackResult> {
  const payload = {
    cedula: data.cedula.replace(/-/g, ""),
    email: data.email,
    name: data.name ?? "",
    comments: data.comments,
  };

  try {
    const response = await fetch(API.feedback, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const failure = z
        .object({
          success: z.literal(false),
          code: z.enum(["NOT_CONFIGURED", "BAD_REQUEST", "SERVER_ERROR"]),
        })
        .safeParse(json);
      return failure.success
        ? failure.data
        : { success: false, code: "SERVER_ERROR" };
    }

    const result = z.object({ success: z.literal(true) }).safeParse(json);
    return result.success
      ? { success: true }
      : { success: false, code: "SERVER_ERROR" };
  } catch (error) {
    console.error("[feedbackService] network error:", error);
    return { success: false, code: "NETWORK_ERROR" };
  }
}
