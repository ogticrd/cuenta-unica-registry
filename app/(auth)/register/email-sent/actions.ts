"use server";

import { getT } from "@/lib/i18n/server";
import { createOryClient } from "@/lib/ory/client";
import { getServerCookies } from "@/lib/ory/cookies";

export interface VerifyCodeState {
  success?: boolean;
  code?: VerifyCodeErrorCode;
  error?: string;
}

export type VerifyCodeErrorCode =
  | "missing_data"
  | "invalid_code_length"
  | "invalid_code"
  | "ory_verification_error"
  | "expired_code";

export async function verifyCodeAction(
  _prevState: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const t = await getT("email_sent");
  const flow = formData.get("flow") as string;
  const code = formData.get("code") as string;

  if (!flow || !code) {
    return { code: "missing_data", error: t("error_missing_data") };
  }

  if (code.length !== 6) {
    return { code: "invalid_code_length", error: t("error_code_length") };
  }

  try {
    const oryClient = createOryClient();
    const cookie = await getServerCookies();

    const response = await oryClient.updateVerificationFlow({
      flow,
      cookie,
      updateVerificationFlowBody: {
        method: "code",
        code,
      },
    });

    if (response.data.state === "passed_challenge") {
      return { success: true };
    }

    return { code: "invalid_code", error: t("error_invalid_code") };
  } catch (err: unknown) {
    const oryError = err as {
      response?: { data?: { ui?: { messages?: Array<{ text: string }> } } };
    };
    const messages = oryError?.response?.data?.ui?.messages;

    if (messages && messages.length > 0) {
      return { code: "ory_verification_error", error: messages[0].text };
    }

    console.error("[verifyCodeAction] Unexpected error:", err);
    return { code: "expired_code", error: t("error_expired_code") };
  }
}
