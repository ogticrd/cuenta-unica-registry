import "server-only";

import { getRequestOrigin } from "@/lib/ory/request-origin";
import { getServerLocale } from "@/lib/ory/server-locale";
import { getOryConfig } from "@/ory.config";

export async function getServerOryConfig() {
  const config = getOryConfig(await getServerLocale());
  const requestOrigin = await getRequestOrigin();

  return {
    ...config,
    sdk: {
      ...config.sdk,
      url: requestOrigin,
      options: {
        ...config.sdk?.options,
        credentials: "include" as const,
      },
    },
  };
}
