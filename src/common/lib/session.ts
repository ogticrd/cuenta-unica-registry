'use server';

import type { Session } from '@ory/client';
import { cookies } from 'next/headers';
import { ory } from './ory';

export async function session() {
  const cks = await cookies();
  const userCookie = cks
    .getAll()
    .find((key) => key.name.includes('ory_session'));

  return ory
    .toSession({ cookie: `${userCookie?.name}=${userCookie?.value}` })
    .then((resp) => resp.data as Session)
    .catch(() => ({}) as never);
}
