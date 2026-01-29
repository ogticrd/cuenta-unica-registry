'use server';

import { Configuration, IdentityApi } from '@ory/client';
import { redirect } from 'next/navigation';

const backend = new IdentityApi(
  new Configuration({
    basePath: process.env.NEXT_PUBLIC_ORY_SDK_URL,
    accessToken: process.env.ORY_SDK_TOKEN,
  }),
);

export async function findIamCitizen(cedula: string) {
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

/**
 * Finds an identity by cedula without redirecting for unverified emails.
 * Used in recovery flow where we need to check existence without side effects.
 */
export async function findIamCitizenForRecovery(cedula: string) {
  const { data: identities } = await backend
    .listIdentities({
      credentialsIdentifier: cedula,
    })
    .catch(() => findAccountInBackoffice(cedula));

  return {
    exists: identities.length !== 0,
    identities,
  };
}

/**
 * Deletes all identities associated with a cedula.
 * Used in account recovery flow to remove existing account before creating new one.
 * @param cedula - The cedula (username) to search for
 * @returns true if at least one identity was deleted, false if no identities found
 */
export async function deleteIdentityByCedula(cedula: string): Promise<boolean> {
  const { data: identities } = await backend
    .listIdentities({
      credentialsIdentifier: cedula,
    })
    .catch(() => ({ data: [] }));

  if (identities.length === 0) {
    return false;
  }

  // Delete all identities found (should normally be just one)
  for (const identity of identities) {
    await backend.deleteIdentity({ id: identity.id }).catch((error) => {
      console.error(
        `Failed to delete identity ${identity.id}:`,
        error?.response?.data || error?.message || error,
      );
      throw error;
    });
  }

  return true;
}

export async function findIdentityById(id: string) {
  return backend
    .getIdentity({ id })
    .then((res) => res.data)
    .catch((error) => {
      console.error(error?.response?.data || error?.message || error);
      return null;
    });
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
