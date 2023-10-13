'use server';

import { pwnedPassword } from 'hibp';

import { Crypto } from '@/common/helpers';
import logger from '@/common/lib/logger';

const intl = {
  error: {
    emptyPasswd: "Password can't be empty",
    crypto: 'Decryption Error:',
  },
};

export async function verifyPassword(password: string) {
  try {
    const data = await pwnedPassword(Crypto.decrypt(password));

    return { data };
  } catch (error) {
    logger.error(intl.error.crypto, error);

    return {
      error: intl.error.crypto,
    };
  }
}
