"use server";

import { createOryClient } from "@/lib/ory/client";
import { getT } from "@/lib/i18n/server";

export interface VerifyCodeState {
  success?: boolean;
  error?: string;
}

export async function verifyCodeAction(
  _prevState: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const t = await getT("email_sent");
  const flow = formData.get("flow") as string;
  const code = formData.get("code") as string;

  if (!flow || !code) {
    return { error: t("error_missing_data") };
  }

  if (code.length !== 6) {
    return { error: t("error_code_length") };
  }

  try {
    const oryClient = createOryClient();

    const response = await oryClient.updateVerificationFlow({
      flow,
      updateVerificationFlowBody: {
        method: "code",
        code,
      },
    });

    if (response.data.state === "passed_challenge") {
      return { success: true };
    }

    return { error: t("error_invalid_code") };
  } catch (err: unknown) {
    const oryError = err as {
      response?: { data?: { ui?: { messages?: Array<{ text: string }> } } };
    };
    const messages = oryError?.response?.data?.ui?.messages;

    if (messages && messages.length > 0) {
      return { error: messages[0].text };
    }

    console.error("[verifyCodeAction] Unexpected error:", err);
    return { error: t("error_expired_code") };
  }
}
