'use server';

import { pwnedPassword } from 'hibp';

/**
 * Fetches the number of times the the given password has
 * been exposed in a breach (0 indicating no exposure).
 */
export async function verifyPassword(password: string) {
  return pwnedPassword(password);
}
