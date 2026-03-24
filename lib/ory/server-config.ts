import "server-only";

import { getServerLocale } from "@/lib/ory/server-locale";
import { getOryConfig } from "@/ory.config";

export async function getServerOryConfig() {
  return getOryConfig(await getServerLocale());
}
