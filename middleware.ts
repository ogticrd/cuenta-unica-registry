import { createOryMiddleware } from "@ory/nextjs/middleware"
import oryConfig from "@/ory.config"
import type { NextRequest } from "next/server"

const oryMiddleware = createOryMiddleware(oryConfig)

export function middleware(request: NextRequest) {
  return oryMiddleware(request)
}

export const config = {
  matcher: [
    "/self-service/:path*",
    "/sessions/whoami",
    "/ui/:path*",
    "/.well-known/ory/:path*",
    "/.ory/:path*",
  ],
}
