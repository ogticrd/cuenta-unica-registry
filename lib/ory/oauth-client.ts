import "server-only";

import { Configuration, OAuth2Api } from "@ory/client";

function createOAuth2AdminClient() {
  const basePath = process.env.ORY_SDK_URL;
  const accessToken = process.env.ORY_SDK_TOKEN;

  if (!basePath) {
    throw new Error("Missing ORY_SDK_URL environment variable");
  }

  if (!accessToken) {
    throw new Error("Missing ORY_SDK_TOKEN environment variable");
  }

  return new OAuth2Api(
    new Configuration({
      basePath,
      accessToken,
    }),
  );
}

let oauth2AdminClient: OAuth2Api | null = null;

function getResponseStatus(error: unknown) {
  return (error as { response?: { status?: unknown } })?.response?.status;
}

export function getOAuth2AdminClient() {
  if (!oauth2AdminClient) {
    oauth2AdminClient = createOAuth2AdminClient();
  }

  return oauth2AdminClient;
}

export async function getOAuth2Client(clientId: string) {
  try {
    const response = await getOAuth2AdminClient().getOAuth2Client({
      id: clientId,
    });

    return response.data;
  } catch (error) {
    if (getResponseStatus(error) === 404) {
      return null;
    }

    throw error;
  }
}
