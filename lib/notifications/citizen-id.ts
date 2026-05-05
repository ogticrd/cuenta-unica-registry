import type { Session } from "@ory/client";

export function normalizeCitizenId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\D/g, "");
  return normalized.length === 11 ? normalized : null;
}

export function getCitizenIdFromSession(session: Session): string | null {
  const traits = session.identity?.traits;
  if (!traits || typeof traits !== "object") {
    return null;
  }

  const username = (traits as Record<string, unknown>).username;
  return normalizeCitizenId(username);
}
