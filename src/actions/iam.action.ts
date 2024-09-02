'use server';

import { Configuration, IdentityApi } from '@ory/client';

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

  return {
    exists: identities.length !== 0,
  };
}

async function findAccountInBackoffice(cedula: string) {
  const url = new URL('v1/accounts', process.env.BACKOFFICE_API_URL);
  url.searchParams.append('term', cedula);

  const resp = await fetch(url, withCredentials());

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
