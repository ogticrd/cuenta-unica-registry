import { Amplify, withSSRContext } from 'aws-amplify';
import { Rekognition } from '@aws-sdk/client-rekognition';
import { NextApiRequest } from 'next/types';

Amplify.configure({ ssr: true });

export async function getRekognitionClient(
  req: NextApiRequest
): Promise<Rekognition> {
  const SSR = withSSRContext({ req });
  const credentials = await SSR.Credentials.get();

  const rekognitionClient = new Rekognition({
    credentials,
  });

  return rekognitionClient;
}
