import "server-only";

import { headers } from "next/headers";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

export async function getRequestOrigin() {
  const h = await headers();
  const host =
    firstHeaderValue(h.get("x-forwarded-host")) ??
    firstHeaderValue(h.get("host"));
  const protocol =
    firstHeaderValue(h.get("x-forwarded-proto")) ??
    firstHeaderValue(h.get("x-forwarded-protocol")) ??
    "https";

  if (!host) {
    throw new Error("Unable to determine public request host");
  }

  return `${protocol}://${host}`;
}
