import { NextRequest, NextResponse } from 'next/server';
import { pwnedPassword } from 'hibp';

import { Crypto } from '@/helpers';
import logger from '@/lib/logger';

export async function GET(
  req: NextRequest,
  params: { params: { password: string } },
  res: NextResponse<number | void>,
): Promise<NextResponse> {
  const { password } = params.params;

  if (typeof password !== 'undefined') {
    const passwordKey = Array.isArray(password) ? password[0] : password;

    try {
      const data = await pwnedPassword(Crypto.decrypt(passwordKey));
      return NextResponse.json({
        data,
        status: 200,
      });
    } catch (error) {
      logger.error('Decryption Error: ', error);

      return NextResponse.json({
        status: 500,
      });
    }
  } else {
    return NextResponse.json({
      status: 400,
    });
  }
}
