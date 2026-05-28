"use client";

import type { JourneyEventRequest } from "@/lib/analytics/types";
import { API } from "@/lib/constants/api";

export async function trackJourneyEvent(input: JourneyEventRequest) {
  try {
    await fetch(API.analyticsJourney, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
      keepalive: true,
    });
  } catch (error) {
    console.error("[trackJourneyEvent] Failed to send journey event:", error);
  }
}
