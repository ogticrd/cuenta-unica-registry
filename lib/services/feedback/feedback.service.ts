import { API } from "@/lib/constants/api";
import type { FeedbackFormData } from "@/lib/schemas/feedback/feedback.schema";

type FeedbackResult =
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

    if (!response.ok) {
      if (response.status === 400) {
        return { success: false, code: "BAD_REQUEST" };
      }
      return { success: false, code: "SERVER_ERROR" };
    }

    const json = await response.json();
    return { success: true, ...json };
  } catch (error) {
    console.error("[feedbackService] network error:", error);
    return { success: false, code: "NETWORK_ERROR" };
  }
}
