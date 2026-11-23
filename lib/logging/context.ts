import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

interface RequestLogContext {
  requestId: string;
  journeyId?: string;
  route: string;
  method?: string;
  startedAt: number;
  traceId?: string;
  spanId?: string;
  traceSampled?: boolean;
}

const storage = new AsyncLocalStorage<RequestLogContext>();

export function getRequestLogContext() {
  return storage.getStore();
}

export function createRequestLogContext(
  route: string,
  request?: Pick<Request, "method" | "headers">,
) {
  const context: RequestLogContext = {
    requestId: randomUUID(),
    route,
    method: request?.method,
    startedAt: Date.now(),
  };
  const cloudTrace = request?.headers
    .get("x-cloud-trace-context")
    ?.match(/^([a-f0-9]{32})(?:\/(\d{1,20}))?(?:;o=([01]))?$/i);
  const traceparent = request?.headers
    .get("traceparent")
    ?.match(/^00-([a-f0-9]{32})-([a-f0-9]{16})-([a-f0-9]{2})$/i);
  if (cloudTrace && !/^0+$/.test(cloudTrace[1])) {
    context.traceId = cloudTrace[1].toLowerCase();
    context.traceSampled = cloudTrace[3] === "1";
    if (cloudTrace[2]) {
      const span = BigInt(cloudTrace[2]);
      if (span > BigInt(0) && span < BigInt("18446744073709551616")) {
        context.spanId = span.toString(16).padStart(16, "0");
      }
    }
  } else if (
    traceparent &&
    !/^0+$/.test(traceparent[1]) &&
    !/^0+$/.test(traceparent[2])
  ) {
    context.traceId = traceparent[1].toLowerCase();
    context.spanId = traceparent[2].toLowerCase();
    context.traceSampled = (Number.parseInt(traceparent[3], 16) & 1) === 1;
  }
  return context;
}

export function runWithRequestLogContext<T>(
  context: RequestLogContext,
  callback: () => T,
): T {
  return storage.run(context, callback);
}
