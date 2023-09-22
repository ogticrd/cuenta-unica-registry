import { NextRequest, NextResponse } from 'next/server';

import { getRekognitionClient } from '@/helpers';

export async function POST(req: NextRequest) {
  const client = await getRekognitionClient(req);

  const { SessionId: sessionId } = await client.createFaceLivenessSession({
    // TODO: Create a unique token for each request, and reuse on retry
    // ClientRequestToken: req.cookies.token,
  });

  return NextResponse.json({ sessionId });
}
