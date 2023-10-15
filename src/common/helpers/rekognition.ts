import { Amplify, withSSRContext } from 'aws-amplify';
import { Rekognition } from '@aws-sdk/client-rekognition';
import { NextRequest } from 'next/server';
import awsExports from '@/aws-exports';

Amplify.configure({ ...awsExports, ssr: true });

export async function getRekognitionClient(
  req: NextRequest,
): Promise<Rekognition> {
  const SSR = withSSRContext({ req });
  const credentials = await SSR.Credentials.get();

  const rekognitionClient = new Rekognition({
    region: 'us-east-1',
    credentials,
  });

  return rekognitionClient;
}
