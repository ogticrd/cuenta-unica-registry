import { NextResponse } from "next/server";
import { clientEventSchema } from "@/lib/logging/client-event";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";
import { getRequestOrigin } from "@/lib/utils/return-url";

const MAX_BODY_BYTES = 2048;
const MAX_REPORTS_PER_MINUTE = 120;
let windowStartedAt = Date.now();
let reports = 0;

async function handlePost(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (
    origin !== getRequestOrigin(request.headers, request.url) ||
    (site && site !== "same-origin" && site !== "none")
  ) {
    return NextResponse.json(
      { success: false, code: "invalid_origin" },
      { status: 403 },
    );
  }
  if (Date.now() - windowStartedAt >= 60000) {
    windowStartedAt = Date.now();
    reports = 0;
  }
  if (reports >= MAX_REPORTS_PER_MINUTE) {
    return NextResponse.json(
      { success: false, code: "report_limit" },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      },
    );
  }
  reports += 1;
  if (
    request.headers.get("content-type")?.split(";")[0] !== "application/json"
  ) {
    return NextResponse.json(
      { success: false, code: "invalid_payload" },
      { status: 400 },
    );
  }
  const reader = request.body?.getReader();
  if (!reader)
    return NextResponse.json(
      { success: false, code: "invalid_payload" },
      { status: 400 },
    );
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return NextResponse.json(
          { success: false, code: "payload_too_large" },
          { status: 413 },
        );
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
  } catch {
    return NextResponse.json(
      { success: false, code: "invalid_payload" },
      { status: 400 },
    );
  } finally {
    reader.releaseLock();
  }
  const payload: unknown = (() => {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  })();
  const parsed = clientEventSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: "invalid_payload" },
      { status: 400 },
    );
  }
  const { event, stack, ...context } = parsed.data;
  const log = event === "form_error" ? logger.warn : logger.error;
  const error = new Error();
  error.name = context.errorType ?? "Error";
  error.stack = stack;
  log(
    "Evento técnico reportado por el navegador",
    {
      operation: `browser.${event}`,
      event,
      origin: "browser",
      ...context,
    },
    stack ? error : undefined,
  );
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export const POST = withRequestLogging(
  "/api/observability/client-errors",
  handlePost,
  { logFailures: false },
);
