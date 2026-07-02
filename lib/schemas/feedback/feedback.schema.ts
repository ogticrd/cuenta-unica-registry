import { z } from "zod";

type Translate = (key: string) => string;

export function createFeedbackSchema(t: Translate) {
  return z.object({
    cedula: z.string().min(11, t("validation_cedula_required")),
    email: z.string().email(t("validation_email_invalid")),
    name: z.string().optional(),
    comments: z.string().min(4, t("validation_comments_required")),
  });
}

export type FeedbackFormData = z.infer<ReturnType<typeof createFeedbackSchema>>;

// Schema for the server-side API endpoint payload (does not need translations)
export const feedbackApiPayloadSchema = z.object({
  cedula: z.string().length(11), // Cedula is stripped of dashes before sending
  email: z.string().email(),
  name: z.string().optional(),
  comments: z.string().min(4),
});
