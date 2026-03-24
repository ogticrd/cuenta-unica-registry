import { Configuration, FrontendApi } from "@ory/client";

/**
 * Server-side Ory SDK client.
 * Uses ORY_SDK_URL (server-only) as fallback.
 * This client is used in Route Handlers for session/logout operations.
 */
export function createOryClient() {
  const baseUrl = process.env.ORY_SDK_URL;

  if (!baseUrl) {
    throw new Error("Missing ORY_SDK_URL environment variable");
  }

  return new FrontendApi(
    new Configuration({
      basePath: baseUrl,
      baseOptions: {
        withCredentials: true,
      },
    }),
  );
}

/** Singleton instance for server-side use */
export const oryClient = createOryClient();
