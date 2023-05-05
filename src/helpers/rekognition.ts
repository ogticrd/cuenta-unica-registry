import { Rekognition } from "@aws-sdk/client-rekognition";
import { Amplify, withSSRContext } from "aws-amplify";
import { NextApiRequest } from "next/types";

import awsExports from "../aws-exports";

Amplify.configure({ ...awsExports, ssr: true });

export async function getRekognitionClient(
  req: NextApiRequest
): Promise<Rekognition> {
  const { Credentials } = withSSRContext({ req });
  const credentials = await Credentials.get();
  const endpoint = "https://rekognition.us-east-1.amazonaws.com";

  return new Rekognition({
    region: "us-east-1",
    credentials,
    endpoint,
  });
}
