"use client";

import { useEffect, useMemo, useRef } from "react";
import type { JourneyEventRequest } from "@/lib/analytics/types";
import { trackJourneyEvent } from "@/lib/services/analytics/journey.service";

export interface JourneyEventProps extends JourneyEventRequest {
  enabled?: boolean;
}

export function buildJourneyEventPayload({
  clientId,
  clientName,
  errorCode,
  eventName,
  flowId,
  institutionName,
  linkageStatus,
  metadata,
  oryFlowType,
  outcome,
  returnUrl,
  sessionId,
  step,
}: JourneyEventRequest): JourneyEventRequest {
  return {
    clientId,
    clientName,
    errorCode,
    eventName,
    flowId,
    institutionName,
    linkageStatus,
    metadata,
    oryFlowType,
    outcome,
    returnUrl,
    sessionId,
    step,
  };
}

export function JourneyEvent({
  clientId,
  clientName,
  enabled = true,
  errorCode,
  eventName,
  flowId,
  institutionName,
  linkageStatus,
  metadata,
  oryFlowType,
  outcome,
  returnUrl,
  sessionId,
  step,
}: JourneyEventProps) {
  const sent = useRef(false);
  const event = useMemo(
    () =>
      buildJourneyEventPayload({
        clientId,
        clientName,
        errorCode,
        eventName,
        flowId,
        institutionName,
        linkageStatus,
        metadata,
        oryFlowType,
        outcome,
        returnUrl,
        sessionId,
        step,
      }),
    [
      clientId,
      clientName,
      errorCode,
      eventName,
      flowId,
      institutionName,
      linkageStatus,
      metadata,
      oryFlowType,
      outcome,
      returnUrl,
      sessionId,
      step,
    ],
  );

  useEffect(() => {
    if (!enabled || sent.current) {
      return;
    }

    sent.current = true;
    void trackJourneyEvent(event);
  }, [enabled, event]);

  return null;
}
