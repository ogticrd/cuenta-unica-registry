import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAmplifyConfig } from "@/lib/aws/amplify-config";

describe("getAmplifyConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns config with env var values when set", () => {
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = "us-east-1_TestPool";
    process.env.NEXT_PUBLIC_AWS_REGION = "us-west-2";
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID = "client-id-123";
    process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID = "us-east-1:identity-pool";

    const config = getAmplifyConfig();

    expect(config.auth.user_pool_id).toBe("us-east-1_TestPool");
    expect(config.auth.aws_region).toBe("us-west-2");
    expect(config.auth.user_pool_client_id).toBe("client-id-123");
    expect(config.auth.identity_pool_id).toBe("us-east-1:identity-pool");
  });

  it("falls back to defaults when env vars are missing", () => {
    delete process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    delete process.env.NEXT_PUBLIC_AWS_REGION;
    delete process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID;

    const config = getAmplifyConfig();

    expect(config.auth.user_pool_id).toBe("");
    expect(config.auth.aws_region).toBe("us-east-1");
    expect(config.auth.user_pool_client_id).toBe("");
    expect(config.auth.identity_pool_id).toBe("");
  });

  it("returns the expected version string", () => {
    const config = getAmplifyConfig();

    expect(config.version).toBe("1.4");
  });

  it("returns the correct auth structure shape", () => {
    const config = getAmplifyConfig();

    expect(config.auth).toEqual(
      expect.objectContaining({
        mfa_methods: [],
        standard_required_attributes: ["email"],
        username_attributes: ["email"],
        user_verification_types: ["email"],
        groups: [],
        mfa_configuration: "NONE",
        unauthenticated_identities_enabled: true,
      }),
    );
  });

  it("returns password policy requirements", () => {
    const config = getAmplifyConfig();

    expect(config.auth.password_policy).toEqual({
      min_length: 8,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: true,
      require_uppercase: true,
    });
  });
});
