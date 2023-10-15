'use server';

import { unwrap } from '@/common/helpers';
import type { Identity } from '../types';

export async function findIamCitizen(cedula: string) {
  const url = new URL('admin/identities', process.env.NEXT_PUBLIC_ORY_SDK_URL);
  url.searchParams.append('credentials_identifier', cedula);

  const identity = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.ORY_SDK_TOKEN}`,
    },
  }).then<Identity[]>(unwrap);

  return {
    exists: identity.length !== 0,
  };
}
