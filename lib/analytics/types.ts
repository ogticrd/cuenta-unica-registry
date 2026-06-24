export interface JourneyEventRequest {
  eventName: string;
  step?: string;
  outcome?: string;
  errorCode?: string;
  flowId?: string;
  oryFlowType?: string;
  clientId?: string;
  linkageStatus?: "linked" | "unlinked";
  identityId?: string;
  sessionId?: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}
