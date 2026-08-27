import "server-only";

import type { RekognitionClientConfig } from "@aws-sdk/client-rekognition";
import { RekognitionClient } from "@aws-sdk/client-rekognition";

const GOOGLE_IDENTITY_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity";
const DEFAULT_WEB_IDENTITY_AUDIENCE = "sts.amazonaws.com";
const DEFAULT_ROLE_SESSION_NAME = "cuenta-unica-registry";
const CREDENTIAL_EXPIRATION_BUFFER_MS = 5 * 60 * 1000;
const AWS_IAM_ROLE_ARN_PATTERN =
  /^arn:aws(?:-[a-z]+)*:iam::\d{12}:role\/[\w+=,.@/-]+$/;

type AwsSessionCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
};

let cachedFederatedCredentials: AwsSessionCredentials | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

function getOptionalEnv(name: string) {
  const value = process.env[name];
  return value?.trim() ? value : undefined;
}

function getTagValue(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`));
  return match?.[1];
}

async function fetchGoogleIdentityToken() {
  const audience =
    getOptionalEnv("AWS_WEB_IDENTITY_TOKEN_AUDIENCE") ??
    DEFAULT_WEB_IDENTITY_AUDIENCE;
  const url = new URL(GOOGLE_IDENTITY_TOKEN_URL);

  url.searchParams.set("audience", audience);
  url.searchParams.set("format", "full");

  const response = await fetch(url, {
    headers: {
      "Metadata-Flavor": "Google",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Google identity token: ${response.status}`,
    );
  }

  return response.text();
}

async function assumeAwsRoleWithGoogleIdentity(
  roleArn: string,
): Promise<AwsSessionCredentials> {
  const webIdentityToken = await fetchGoogleIdentityToken();
  const body = new URLSearchParams({
    Action: "AssumeRoleWithWebIdentity",
    Version: "2011-06-15",
    RoleArn: roleArn,
    RoleSessionName:
      getOptionalEnv("AWS_ROLE_SESSION_NAME") ?? DEFAULT_ROLE_SESSION_NAME,
    WebIdentityToken: webIdentityToken,
  });

  const response = await fetch("https://sts.amazonaws.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const xml = await response.text();

  if (!response.ok) {
    throw new Error(
      `Failed to assume AWS role with Google identity: ${response.status} ${xml}`,
    );
  }

  const accessKeyId = getTagValue(xml, "AccessKeyId");
  const secretAccessKey = getTagValue(xml, "SecretAccessKey");
  const sessionToken = getTagValue(xml, "SessionToken");
  const expiration = getTagValue(xml, "Expiration");

  if (!(accessKeyId && secretAccessKey && sessionToken && expiration)) {
    throw new Error(
      "AWS STS response did not include complete temporary credentials",
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    expiration: new Date(expiration),
  };
}

async function getFederatedCredentials(
  roleArn: string,
): Promise<AwsSessionCredentials> {
  if (
    cachedFederatedCredentials &&
    cachedFederatedCredentials.expiration.getTime() - Date.now() >
      CREDENTIAL_EXPIRATION_BUFFER_MS
  ) {
    return cachedFederatedCredentials;
  }

  cachedFederatedCredentials = await assumeAwsRoleWithGoogleIdentity(roleArn);
  return cachedFederatedCredentials;
}

function getCredentials() {
  const roleArn = getOptionalEnv("AWS_ROLE_ARN");

  if (roleArn) {
    if (!AWS_IAM_ROLE_ARN_PATTERN.test(roleArn)) {
      throw new Error(
        "AWS_ROLE_ARN must be an IAM role ARN like arn:aws:iam::<account-id>:role/<role-name>. For local development, leave AWS_ROLE_ARN empty and use AWS_PROFILE.",
      );
    }

    return () => getFederatedCredentials(roleArn);
  }

  return undefined;
}

let client: RekognitionClient | null = null;

export function createRekognitionClientConfig(): RekognitionClientConfig {
  return {
    region: getRequiredEnv("AWS_REGION"),
    credentials: getCredentials(),
  };
}

export function getRekognitionClient() {
  if (!client) {
    client = new RekognitionClient(createRekognitionClientConfig());
  }

  return client;
}
