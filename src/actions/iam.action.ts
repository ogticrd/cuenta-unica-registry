'use server';

import { Configuration, IdentityApi } from '@ory/client';
import { redirect } from 'next/navigation';

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

  // complexity go brr! O(n^2)
  // se espera que `identities` sea de longitud <= 1
  for (const account of identities) {
    for (const addr of account.verifiable_addresses ?? []) {
      if (!addr.verified) redirect(`confirmation?email=${addr.value}`);
    }
  }

  return {
    exists: identities.length !== 0,
  };
}
