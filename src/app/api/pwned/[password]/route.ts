import { NextRequest, NextResponse } from 'next/server';
import { pwnedPassword } from 'hibp';

import { Crypto } from '@/helpers';
import logger from '@/lib/logger';

export async function GET(req: NextRequest, { params: { password } }: Props) {
  if (!password) {
    return NextResponse.json(
      {
        error: intl.error.emptyPasswd,
      },
      { status: 400 },
    );
  }

  try {
    const data = await pwnedPassword(Crypto.decrypt(password));

    return NextResponse.json({ data });
  } catch (error) {
    logger.error(intl.error.crypto, error);

    return NextResponse.json(
      {
        error: intl.error.crypto,
      },
      { status: 500 },
    );
  }
}

type Props = { params: { password: string } };

const intl = {
  error: {
    emptyPasswd: "Password can't be empty",
    crypto: 'Decryption Error:',
  },
};
