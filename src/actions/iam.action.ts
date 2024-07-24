'use server';

import { Configuration, IdentityApi } from '@ory/client';

export async function findIamCitizen(cedula: string) {
  const backend = new IdentityApi(
    new Configuration({
      basePath: process.env.NEXT_PUBLIC_ORY_SDK_URL,
      accessToken: process.env.ORY_SDK_TOKEN,
    }),
  );

  const { data: identities } = await backend.listIdentities({
    credentialsIdentifier: cedula,
  });

  return {
    exists: identities.length !== 0,
  };
}
