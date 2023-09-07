import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { Identity } from '../../types';

export const dynamicParams = true;

export async function GET(
  req: NextRequest,
  { params }: { params: { cedula: string } },
): Promise<NextResponse> {
  const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_ORY_SDK_URL,
    headers: {
      Authorization: 'Bearer ' + process.env.ORY_SDK_TOKEN,
    },
  });

  const cedula = params.cedula;

  const { data: identity } = await http.get<Identity[]>(
    `/admin/identities?credentials_identifier=${cedula}`,
  );

  const exists = identity.length !== 0;

  return NextResponse.json({
    exists: exists,
    status: 200,
  });
}
