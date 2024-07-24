import { fetchAuthSession } from 'aws-amplify/auth/server';
import { Rekognition } from '@aws-sdk/client-rekognition';
import type { NextRequest } from 'next/server';
import { Amplify } from 'aws-amplify';

import { runWithAmplifyServerContext } from './amplify-server';
import config from '@/amplifyconfiguration.json';

Amplify.configure(config, { ssr: true });

export async function getRekognitionClient(
  request: NextRequest,
): Promise<Rekognition> {
  const { credentials } = await runWithAmplifyServerContext({
    nextServerContext: { request, response: new Response() },
    operation: fetchAuthSession,
  });

  return new Rekognition({
    region: 'us-east-1',
    credentials,
  });
}
