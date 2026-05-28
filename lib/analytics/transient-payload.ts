import "server-only";

import { getAnalyticsContext } from "./context";
import {
  type AnalyticsTransientPayload,
  buildAnalyticsTransientPayload,
} from "./transient-payload-core";

function getEnvironment() {
  return (
    process.env.ANALYTICS_ENVIRONMENT || process.env.NODE_ENV || "production"
  );
}

function getProjectId() {
  return (
    process.env.ANALYTICS_PROJECT_ID || process.env.ORY_PROJECT_ID || "registry"
  );
}

export async function getAnalyticsTransientPayload(): Promise<
  AnalyticsTransientPayload | undefined
> {
  const context = await getAnalyticsContext();

  if (!context) {
    return undefined;
  }

  return buildAnalyticsTransientPayload(context, {
    projectId: getProjectId(),
    environment: getEnvironment(),
  });
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
