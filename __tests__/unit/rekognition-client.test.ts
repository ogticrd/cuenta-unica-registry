import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRekognitionClientConfig } from "@/lib/aws/rekognition-client";

vi.mock("server-only", () => ({}));

describe("createRekognitionClientConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      AWS_REGION: "us-east-1",
    };
    delete process.env.AWS_ROLE_ARN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses the default AWS SDK credential chain for local profile setup", () => {
    process.env.AWS_PROFILE = "cuenta-unica-dev";
    const config = createRekognitionClientConfig();

    expect(config.region).toBe("us-east-1");
    expect(config.credentials).toBeUndefined();
  });

  it("rejects a copied STS assumed-role ARN in AWS_ROLE_ARN", () => {
    process.env.AWS_ROLE_ARN =
      "arn:aws:sts::XXXXXXXXXXXX:assumed-role/CuentaUnicaRegistryLocalDeveloperRole/botocore-session-1783340193";

    expect(() => createRekognitionClientConfig()).toThrow(
      "AWS_ROLE_ARN must be an IAM role ARN",
    );
  });
});
