'use server';

import { pwnedPassword } from 'hibp';

export async function verifyPassword(password: string) {
  const data = await pwnedPassword(password);

  return { data };
}
