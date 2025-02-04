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

  const { data: identities } = await backend
    .listIdentities({
      credentialsIdentifier: cedula,
    })
    .catch(() => findAccountInBackoffice(cedula));

  // complexity go brr! O(n^2)
  // se espera que `identities` sea de longitud <= 1
  for (const account of identities) {
    for (const addr of account.verifiable_addresses ?? []) {
      if (!addr.verified) redirect(`/confirmation?email=${addr.value}`);
    }
  }

  return {
    exists: identities.length !== 0,
  };
}

async function findAccountInBackoffice(cedula: string) {
  const url = new URL('v1/accounts', process.env.BACKOFFICE_API_URL);
  url.searchParams.append('term', cedula);

  const resp = await fetch(url, withCredentials()).catch((e) => ({
    ok: false,
    json: () => Promise.resolve(e.cause),
  }));

  if (resp.ok) {
    return resp
      .json()
      .then((data: Array<BackofficeAccount>) =>
        data.map((data) => ({ ...data, verifiable_addresses: [] })),
      )
      .then((data) => ({ data }));
  }

  await resp.json().then(console.error);

  return { data: [] };
}

type BackofficeAccount = { id: string; cedula: string };

const withCredentials = () => ({
  headers: { 'x-account-apikey': `${process.env.BACKOFFICE_API_KEY}` },
});
