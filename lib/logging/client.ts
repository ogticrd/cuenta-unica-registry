import {
  type ClientEvent,
  clientErrorCodes,
  clientEventSchema,
} from "./client-event";
import { getSafeErrorName, getSafeStack } from "./sanitize";

const reported = new Set<string>();

export function reportClientError(
  event: ClientEvent["event"],
  context: Omit<ClientEvent, "event" | "code"> & { code?: string } = {},
  error?: unknown,
): void {
  if (typeof window === "undefined" || reported.size >= 10) return;
  const code =
    context.code &&
    (clientErrorCodes as readonly string[]).includes(context.code)
      ? context.code
      : context.code
        ? "unexpected_error"
        : undefined;
  const parsed = clientEventSchema.safeParse({
    ...context,
    event,
    code,
    errorType:
      error === undefined ? context.errorType : getSafeErrorName(error),
    stack: getSafeStack(error)?.slice(0, 800),
    digest:
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string"
        ? error.digest
        : undefined,
  });
  if (!parsed.success) return;
  const body = JSON.stringify(parsed.data);
  if (reported.has(body)) return;
  reported.add(body);
  void fetch("/api/observability/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    credentials: "omit",
    keepalive: true,
  }).catch(() => {});
}
