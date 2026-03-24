import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";

import oryConfig from "@/ory.config";

const oryMiddleware = createOryMiddleware(oryConfig);

export function proxy(request: NextRequest) {
  return oryMiddleware(request);
}

export const config = {
  matcher: [
    "/self-service/:path*",
    "/sessions/whoami",
    "/ui/:path*",
    "/.well-known/ory/:path*",
    "/.ory/:path*",
  ],
};
