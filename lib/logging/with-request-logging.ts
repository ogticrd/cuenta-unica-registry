import "server-only";

import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { z } from "zod";
import { readAnalyticsContextFromRequest } from "@/lib/analytics/context";
import { createRequestLogContext, runWithRequestLogContext } from "./context";
import { logger } from "./logger";

export function withRequestLogging<
  TArgs extends unknown[],
  TResult extends Response,
>(
  route: string,
  handler: (...args: TArgs) => Promise<TResult>,
  options: {
    logFailures?: boolean;
    resolveJourneyId?: (request: Request) => string | undefined;
  } = {},
) {
  return (...args: TArgs): Promise<TResult> => {
    const request = args[0] instanceof Request ? args[0] : undefined;
    const context = createRequestLogContext(route, request);
    return runWithRequestLogContext(context, async () => {
      if (request) {
        const analytics = await readAnalyticsContextFromRequest({
          cookies: new RequestCookies(request.headers),
        });
        const journeyId = z
          .uuid()
          .safeParse(
            options.resolveJourneyId?.(request) ?? analytics?.journeyId,
          );
        if (journeyId.success) {
          context.journeyId = journeyId.data;
        }
      }
      const response = await handler(...args);
      if (response.status >= 400 && options.logFailures !== false) {
        const log = response.status >= 500 ? logger.error : logger.warn;
        log("La solicitud terminó con un error", {
          operation: "http.request",
          status: response.status,
        });
      }
      return response;
    });
  };
}
