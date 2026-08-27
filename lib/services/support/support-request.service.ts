import "server-only";

import type { AnalyticsEnvironment } from "@/lib/analytics/environment";
import {
  getAnalyticsApiBaseUrl,
  getAnalyticsIngressHeaderName,
  getAnalyticsIngressHeaderValue,
} from "@/lib/analytics/ingress-config";

const SUPPORT_REQUEST_TIMEOUT_MS = 3000;

export type SupportRequestChannel = "registration_report";

export type SubmitSupportRequestInput = {
  requestId: string;
  environment: AnalyticsEnvironment;
  accountId: string;
  oryIdentityId: string | null;
  channel: SupportRequestChannel;
  message: string;
  contactEmail: string | null;
  contactName: string | null;
  registrationStep: string | null;
};

export type SubmitSupportRequestResult =
  | { success: true }
  | { success: false; code: "NOT_CONFIGURED" | "SERVER_ERROR" };

function getSupportRequestsUrl() {
  const baseUrl = getAnalyticsApiBaseUrl();

  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}/support/requests`;
}

export async function submitSupportRequest(
  input: SubmitSupportRequestInput,
): Promise<SubmitSupportRequestResult> {
  const supportRequestsUrl = getSupportRequestsUrl();
  const apiKey = getAnalyticsIngressHeaderValue();

  if (!supportRequestsUrl || !apiKey) {
    return { success: false, code: "NOT_CONFIGURED" };
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), SUPPORT_REQUEST_TIMEOUT_MS);

    const response = await fetch(supportRequestsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [getAnalyticsIngressHeaderName()]: apiKey,
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[support] Support request storage rejected write", {
        requestId: input.requestId,
        status: response.status,
      });
      return { success: false, code: "SERVER_ERROR" };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("[support] Support request storage timed out", {
        requestId: input.requestId,
      });
      return { success: false, code: "SERVER_ERROR" };
    }

    console.error("[support] Support request storage failed", {
      requestId: input.requestId,
    });
    return { success: false, code: "SERVER_ERROR" };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
