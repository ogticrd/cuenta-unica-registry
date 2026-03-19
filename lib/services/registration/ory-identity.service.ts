import "server-only"

import { Configuration, IdentityApi } from "@ory/client"

interface CitizenIdentityLookupResult {
  exists: boolean
}

function createOryIdentityClient() {
  const basePath = process.env.ORY_SDK_URL
  const accessToken = process.env.ORY_SDK_TOKEN

  if (!basePath) {
    throw new Error("Missing ORY_SDK_URL environment variable")
  }

  if (!accessToken) {
    throw new Error("Missing ORY_SDK_TOKEN environment variable")
  }

  return new IdentityApi(
    new Configuration({
      basePath,
      accessToken,
    }),
  )
}

export async function checkCitizenIdentity(
  cedula: string,
): Promise<CitizenIdentityLookupResult> {
  const identityClient = createOryIdentityClient()
  const { data: identities } = await identityClient.listIdentities({
    credentialsIdentifier: cedula,
  })

  return {
    exists: identities.length > 0,
  }
}
