import { Amplify, withSSRContext } from 'aws-amplify';
import { Rekognition } from '@aws-sdk/client-rekognition';
import { NextApiRequest } from 'next/types';

import awsExports from '../aws-exports';

Amplify.configure({ ...awsExports, ssr: true });

export async function getRekognitionClient(
  req: NextApiRequest
): Promise<Rekognition> {
  const SSR = withSSRContext({ req });
  const credentials = await SSR.Credentials.get();

  const rekognitionClient = new Rekognition({
    region: awsExports.aws_project_region,
    credentials,
  });

  return rekognitionClient;
}
