"use client";

import { useEffect, useMemo, useRef } from "react";
import type { JourneyEventRequest } from "@/lib/analytics/types";
import { trackJourneyEvent } from "@/lib/services/analytics/journey.service";

interface JourneyEventProps extends JourneyEventRequest {
  enabled?: boolean;
}

export function JourneyEvent({
  enabled = true,
  errorCode,
  eventName,
  flowId,
  oryFlowType,
  outcome,
  step,
}: JourneyEventProps) {
  const sent = useRef(false);
  const event = useMemo(
    () => ({
      errorCode,
      eventName,
      flowId,
      oryFlowType,
      outcome,
      step,
    }),
    [errorCode, eventName, flowId, oryFlowType, outcome, step],
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
