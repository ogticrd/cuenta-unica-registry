import { createOryMiddleware } from "@ory/nextjs/middleware"
import oryConfig from "@/ory.config"

export const middleware = createOryMiddleware(oryConfig)

export const config = {}
