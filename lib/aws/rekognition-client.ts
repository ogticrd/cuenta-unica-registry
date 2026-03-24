import "server-only";

import { RekognitionClient } from "@aws-sdk/client-rekognition";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

let client: RekognitionClient | null = null;

export function getRekognitionClient() {
  if (!client) {
    client = new RekognitionClient({
      region: getRequiredEnv("AWS_REGION"),
      credentials: {
        accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  return client;
}
