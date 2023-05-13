import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { Amplify, withSSRContext } from 'aws-amplify';
import { NextApiRequest } from 'next/types';

import awsExports from '../aws-exports';

Amplify.configure({ ...awsExports, ssr: true });

export async function getRekognitionClient(
  req: NextApiRequest
): Promise<RekognitionClient> {
  const SSR = withSSRContext({ req });
  const credentials = await SSR.Credentials.get();

  return new RekognitionClient({
    region: awsExports.aws_project_region,
    credentials,
  });
}
