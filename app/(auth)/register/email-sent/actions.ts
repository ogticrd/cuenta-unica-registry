"use server";

import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { withAnalyticsTransientPayload } from "@/lib/analytics/transient-payload";
import { getT } from "@/lib/i18n/server";
import { createOryClient } from "@/lib/ory/client";

export interface VerifyCodeState {
  success?: boolean;
  error?: string;
}

async function emitEmailVerificationOutcome(options: {
  success: boolean;
  flowId?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}) {
  await emitAnalyticsEvent(
    {
      eventName: options.success
        ? "identity.email_verification.succeeded"
        : "identity.email_verification.failed",
      source: "registry-app",
      step: "email_verification",
      outcome: options.success ? "succeeded" : "failed",
      ...(options.flowId ? { flowId: options.flowId } : {}),
      ...(options.errorCode ? { errorCode: options.errorCode } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
    { entryPath: "/register/email-sent" },
  );
}

export async function verifyCodeAction(
  _prevState: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const t = await getT("email_sent");
  const flow = formData.get("flow") as string;
  const code = formData.get("code") as string;

  if (!flow || !code) {
    await emitEmailVerificationOutcome({
      success: false,
      errorCode: "invalid_payload",
      metadata: { stage: "form_validation" },
    });
    return { error: t("error_missing_data") };
  }

  if (code.length !== 6) {
    await emitEmailVerificationOutcome({
      success: false,
      flowId: flow,
      errorCode: "invalid_payload",
      metadata: { stage: "code_length" },
    });
    return { error: t("error_code_length") };
  }

  try {
    const oryClient = createOryClient();

    const response = await oryClient.updateVerificationFlow({
      flow,
      updateVerificationFlowBody: await withAnalyticsTransientPayload({
        method: "code",
        code,
      }),
    });

    if (response.data.state === "passed_challenge") {
      await emitEmailVerificationOutcome({
        success: true,
        flowId: flow,
        metadata: { stage: "passed_challenge" },
      });
      return { success: true };
    }

    await emitEmailVerificationOutcome({
      success: false,
      flowId: flow,
      errorCode: "invalid_code",
      metadata: { stage: "verification_response", state: response.data.state },
    });
    return { error: t("error_invalid_code") };
  } catch (err: unknown) {
    const oryError = err as {
      response?: { data?: { ui?: { messages?: Array<{ text: string }> } } };
    };
    const messages = oryError?.response?.data?.ui?.messages;

    if (messages && messages.length > 0) {
      await emitEmailVerificationOutcome({
        success: false,
        flowId: flow,
        errorCode: "ory_validation_error",
        metadata: { stage: "ory_messages" },
      });
      return { error: messages[0].text };
    }

    console.error("[verifyCodeAction] Unexpected error:", err);
    await emitEmailVerificationOutcome({
      success: false,
      flowId: flow,
      errorCode: "unexpected_error",
      metadata: { stage: "exception" },
    });
    return { error: t("error_expired_code") };
  }
}
