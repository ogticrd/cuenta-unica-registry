import { withSSRContext } from 'aws-amplify';
import { Rekognition } from '@aws-sdk/client-rekognition';
import { NextApiRequest } from 'next/types';

export async function getRekognitionClient(
  req: NextApiRequest
): Promise<Rekognition> {
  const SSR = withSSRContext({ req });
  const credentials = await SSR.Credentials.get();

  const rekognitionClient = new Rekognition({
    region: 'us-east1',
    credentials,
  });

  return rekognitionClient;
}
