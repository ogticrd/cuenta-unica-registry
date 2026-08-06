import "server-only";

import {
  type AnalyticsSource,
  type CanonicalEventName,
  isCanonicalEventName,
  resolveLinkageStatus,
} from "./catalog";
import { resolveAnalyticsContext } from "./context";
import type { AnalyticsContext } from "./context-core";
import {
  resolveAnalyticsEnvironment,
  resolveAnalyticsProjectId,
} from "./environment";
import {
  getAnalyticsIngressEventsUrl,
  getAnalyticsIngressHeaderName,
  getAnalyticsIngressHeaderValue,
} from "./ingress-config";

export interface AnalyticsEventInput {
  eventName: string;
  source: AnalyticsSource;
  occurredAt?: string;
  environment?: string;
  projectId?: string;
  accountId?: string;
  journeyId?: string;
  clientId?: string;
  clientName?: string;
  institutionName?: string;
  linkageStatus?: "linked" | "unlinked";
  returnUrl?: string;
  identityId?: string;
  sessionId?: string;
  flowId?: string;
  oryFlowType?: string;
  outcome?: string;
  errorCode?: string;
  step?: string;
  metadata?: Record<string, unknown>;
}

type AnalyticsPayload = {
  schemaVersion: 1;
  source: AnalyticsSource;
  eventName: CanonicalEventName;
  occurredAt: string;
  environment: string;
  projectId: string;
  accountId?: string;
  journeyId: string;
  clientId: string;
  clientName?: string;
  institutionName?: string;
  linkageStatus: "linked" | "unlinked";
  returnUrl?: string;
  identityId?: string;
  sessionId?: string;
  flowId?: string;
  oryFlowType?: string;
  outcome?: string;
  errorCode?: string;
  step?: string;
  metadata?: Record<string, unknown>;
};

const DEFAULT_TIMEOUT_MS = 1200;

function buildPayload(
  input: AnalyticsEventInput,
  context: AnalyticsContext,
): AnalyticsPayload {
  const clientId = input.clientId ?? context.clientId ?? "__unlinked__";
  const linkageStatus = input.linkageStatus ?? resolveLinkageStatus(clientId);
  const resolvedReturnUrl = input.returnUrl ?? context.returnUrl;

  if (!isCanonicalEventName(input.eventName)) {
    throw new Error(`Unsupported analytics event: ${input.eventName}`);
  }

  return {
    schemaVersion: 1,
    source: input.source,
    eventName: input.eventName,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    environment: resolveAnalyticsEnvironment(input.environment),
    projectId: resolveAnalyticsProjectId(input.projectId),
    ...(input.accountId ? { accountId: input.accountId } : {}),
    journeyId: input.journeyId ?? context.journeyId,
    clientId,
    ...((input.clientName ?? context.clientName)
      ? { clientName: input.clientName ?? context.clientName }
      : {}),
    ...((input.institutionName ?? context.institutionName)
      ? { institutionName: input.institutionName ?? context.institutionName }
      : {}),
    linkageStatus,
    ...(resolvedReturnUrl ? { returnUrl: resolvedReturnUrl } : {}),
    ...(input.identityId ? { identityId: input.identityId } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    ...(input.flowId ? { flowId: input.flowId } : {}),
    ...(input.oryFlowType ? { oryFlowType: input.oryFlowType } : {}),
    ...(input.outcome ? { outcome: input.outcome } : {}),
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    ...(input.step ? { step: input.step } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };
}

export async function emitAnalyticsEvent(
  input: AnalyticsEventInput,
  fallback?: Partial<Pick<AnalyticsContext, "entryPath" | "returnUrl">>,
) {
  const ingressUrl = getAnalyticsIngressEventsUrl();

  if (!ingressUrl) {
    return false;
  }
  if (!isCanonicalEventName(input.eventName)) {
    throw new Error(`Unsupported analytics event: ${input.eventName}`);
  }

  const context = await resolveAnalyticsContext(fallback);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const payload = buildPayload(input, context);
    const controller = new AbortController();
    const ingressHeaderValue = getAnalyticsIngressHeaderValue();
    timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const response = await fetch(ingressUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ingressHeaderValue
          ? { [getAnalyticsIngressHeaderName()]: ingressHeaderValue }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        "[analytics] Ingress rejected event",
        response.status,
        body,
      );
      return false;
    }

    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("[analytics] Ingress request timed out");
      return false;
    }

    console.error("[analytics] Failed to emit event:", error);
    return false;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
