import { Amplify, withSSRContext } from 'aws-amplify';
import { Rekognition } from '@aws-sdk/client-rekognition';
import { NextApiRequest } from 'next/types';

const awsConfig = {
  aws_project_region: process.env.AWS_REGION,
  aws_cognito_identity_pool_id: process.env.AMPLIFY_IDENTITYPOOL_ID,
  aws_cognito_region: process.env.AWS_REGION, // This could also be a separate environment variable if needed
  aws_user_pools_id: process.env.AMPLIFY_USERPOOL_ID,
  aws_user_pools_web_client_id: process.env.AMPLIFY_WEBCLIENT_ID,
};

Amplify.configure({ ...awsConfig, ssr: true });

export async function getRekognitionClient(
  req: NextApiRequest
): Promise<Rekognition> {
  const SSR = withSSRContext({ req });
  const credentials = await SSR.Credentials.get();

  const rekognitionClient = new Rekognition({
    region: process.env.AWS_REGION,
    credentials,
  });

  return rekognitionClient;
}
