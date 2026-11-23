import { logger } from "@/lib/logging/logger";
import "server-only";

import { getAnalyticsContext } from "./context";
import {
  resolveAnalyticsEnvironment,
  resolveAnalyticsProjectId,
} from "./environment";
import {
  type AnalyticsTransientPayload,
  buildAnalyticsTransientPayload,
} from "./transient-payload-core";

export async function getAnalyticsTransientPayload(): Promise<
  AnalyticsTransientPayload | undefined
> {
  const context = await getAnalyticsContext();

  if (!context) {
    return undefined;
  }

  try {
    return buildAnalyticsTransientPayload(context, {
      projectId: resolveAnalyticsProjectId(),
      environment: resolveAnalyticsEnvironment(),
    });
  } catch (error) {
    logger.error(
      "[analytics] Failed to build transient payload:",
      { operation: "lib.analytics.transient-payload" },
      error,
    );
    return undefined;
  }
}

export async function withAnalyticsTransientPayload<
  const T extends Record<string, unknown>,
>(body: T): Promise<T & { transient_payload?: AnalyticsTransientPayload }> {
  const transientPayload = await getAnalyticsTransientPayload();

  if (!transientPayload) {
    return body;
  }

  return {
    ...body,
    transient_payload: transientPayload,
  };
}
