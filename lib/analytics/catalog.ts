export const JOURNEY_EVENT_NAMES = [
  "journey.login.entered",
  "journey.registration.entered",
  "journey.registration.identification.entered",
  "journey.registration.liveness.started",
  "journey.registration.email_verification.entered",
  "journey.recovery.entered",
  "journey.verification.entered",
  "journey.settings.entered",
] as const;

export const REGISTRY_OUTCOME_EVENT_NAMES = [
  "registration.identification.succeeded",
  "registration.identification.failed",
  "registration.liveness.session_created",
  "registration.liveness.session_failed",
  "registration.liveness.succeeded",
  "registration.liveness.failed",
  "identity.registration.succeeded",
  "identity.registration.failed",
  "identity.email_verification.succeeded",
  "identity.email_verification.failed",
] as const;

export const ORY_WEBHOOK_EVENT_NAMES = [
  "identity.login.succeeded",
  "identity.recovery.succeeded",
  "identity.verification.succeeded",
  "identity.settings.succeeded",
] as const;

export const CANONICAL_EVENT_NAMES = [
  ...JOURNEY_EVENT_NAMES,
  ...REGISTRY_OUTCOME_EVENT_NAMES,
  ...ORY_WEBHOOK_EVENT_NAMES,
] as const;

export type JourneyEventName = (typeof JOURNEY_EVENT_NAMES)[number];
export type RegistryOutcomeEventName =
  (typeof REGISTRY_OUTCOME_EVENT_NAMES)[number];
export type OryWebhookEventName = (typeof ORY_WEBHOOK_EVENT_NAMES)[number];
export type CanonicalEventName = (typeof CANONICAL_EVENT_NAMES)[number];

export const ANALYTICS_SOURCES = [
  "registry-app",
  "registry-journey",
  "ory-webhook",
] as const;

export type AnalyticsSource = (typeof ANALYTICS_SOURCES)[number];
export type AnalyticsLinkageStatus = "linked" | "unlinked";

export function isJourneyEventName(value: string): value is JourneyEventName {
  return (JOURNEY_EVENT_NAMES as readonly string[]).includes(value);
}

export function isCanonicalEventName(
  value: string,
): value is CanonicalEventName {
  return (CANONICAL_EVENT_NAMES as readonly string[]).includes(value);
}

export function normalizeClientId(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "__unlinked__";
}

export function resolveLinkageStatus(clientId: string): AnalyticsLinkageStatus {
  return clientId === "__unlinked__" ? "unlinked" : "linked";
}
