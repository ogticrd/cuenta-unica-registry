import { NextRequest, NextResponse } from 'next/server';

import type { Identity } from '../../types';

export const dynamicParams = true;

export async function GET(req: NextRequest, { params: { cedula } }: Props) {
  const url = new URL('admin/identities', process.env.NEXT_PUBLIC_ORY_SDK_URL);
  url.searchParams.append('credentials_identifier', cedula);

  const identity = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.ORY_SDK_TOKEN}`,
    },
  }).then<Identity[]>((res) => res.json());

  return NextResponse.json({
    exists: identity.length !== 0,
  });
}

type Props = { params: { cedula: string } };
