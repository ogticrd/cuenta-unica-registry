import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logger } = await import("@/lib/logging/logger");
  const { createRequestLogContext, runWithRequestLogContext } = await import(
    "@/lib/logging/context"
  );
  const digest =
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined;
  runWithRequestLogContext(
    createRequestLogContext(context.routePath, {
      method: request.method,
      headers: new Headers(
        Object.fromEntries(
          Object.entries(request.headers).filter(
            (entry): entry is [string, string] =>
              typeof entry[1] === "string" &&
              ["x-cloud-trace-context", "traceparent"].includes(
                entry[0].toLowerCase(),
              ),
          ),
        ),
      ),
    }),
    () =>
      logger.error(
        "Next.js capturó un error del servidor",
        {
          operation: "next.request_error",
          stage: context.routeType,
          digest,
        },
        error,
      ),
  );
};
