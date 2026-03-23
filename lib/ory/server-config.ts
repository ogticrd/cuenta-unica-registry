import "server-only"

import { getOryConfig } from "@/ory.config"
import { getServerLocale } from "@/lib/ory/server-locale"

export async function getServerOryConfig() {
  return getOryConfig(await getServerLocale())
}
