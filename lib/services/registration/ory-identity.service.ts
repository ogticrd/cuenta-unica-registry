import "server-only";

import { Configuration, IdentityApi } from "@ory/client";

interface CitizenIdentityLookupResult {
  exists: boolean;
  identityId?: string;
}

export function createOryIdentityClient() {
  const basePath = process.env.ORY_SDK_URL;
  const accessToken = process.env.ORY_SDK_TOKEN;

  if (!basePath) {
    throw new Error("Missing ORY_SDK_URL environment variable");
  }

  if (!accessToken) {
    throw new Error("Missing ORY_SDK_TOKEN environment variable");
  }

  return new IdentityApi(
    new Configuration({
      basePath,
      accessToken,
    }),
  );
}

export async function checkCitizenIdentity(
  cedula: string,
): Promise<CitizenIdentityLookupResult> {
  const identityClient = createOryIdentityClient();
  const { data: identities } = await identityClient.listIdentities({
    credentialsIdentifier: cedula,
  });

  return {
    exists: identities.length > 0,
    ...(identities.length === 1 ? { identityId: identities[0].id } : {}),
  };
}

export async function findOryIdentityById(id: string) {
  try {
    const { data } = await createOryIdentityClient().getIdentity({ id });
    return data;
  } catch (error) {
    if (
      (error as { response?: { status?: number } })?.response?.status === 404
    ) {
      return null;
    }
    throw error;
  }
}
