import "server-only";

import {
  type AnalyticsSource,
  type CanonicalEventName,
  isCanonicalEventName,
  resolveLinkageStatus,
} from "./catalog";
import { resolveAnalyticsContext } from "./context";
import type { AnalyticsContext } from "./context-core";

export interface AnalyticsEventInput {
  eventName: string;
  source: AnalyticsSource;
  occurredAt?: string;
  environment?: string;
  projectId?: string;
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

function getIngressUrl() {
  const baseUrl =
    process.env.ANALYTICS_INGRESS_URL ||
    process.env.ANALYTICS_API_BASE_URL ||
    "";

  if (!baseUrl) {
    return "";
  }

  return baseUrl.endsWith("/events") ? baseUrl : `${baseUrl}/events`;
}

function getIngressHeaderName() {
  return process.env.ANALYTICS_INGRESS_API_KEY_HEADER || "Authorization";
}

function getIngressHeaderValue() {
  return process.env.ANALYTICS_INGRESS_API_KEY || "";
}

function getEnvironment(value?: string) {
  return (
    value ||
    process.env.ANALYTICS_ENVIRONMENT ||
    process.env.NODE_ENV ||
    "production"
  );
}

function getProjectId(value?: string) {
  return (
    value ||
    process.env.ANALYTICS_PROJECT_ID ||
    process.env.ORY_PROJECT_ID ||
    "registry"
  );
}

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
    environment: getEnvironment(input.environment),
    projectId: getProjectId(input.projectId),
    journeyId: input.journeyId ?? context.journeyId,
    clientId,
    ...(input.clientName ? { clientName: input.clientName } : {}),
    ...(input.institutionName
      ? { institutionName: input.institutionName }
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
  const ingressUrl = getIngressUrl();

  if (!ingressUrl) {
    return;
  }

  const context = await resolveAnalyticsContext(fallback);
  const payload = buildPayload(input, context);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(ingressUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getIngressHeaderValue()
          ? { [getIngressHeaderName()]: getIngressHeaderValue() }
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
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("[analytics] Ingress request timed out");
      return;
    }

    console.error("[analytics] Failed to emit event:", error);
  } finally {
    clearTimeout(timeout);
  }
}
