/**
 * Generates Amplify configuration from environment variables.
 * Used by AmplifyProvider to configure the client-side Amplify SDK.
 *
 * This replaces a static amplify_outputs.json file, keeping secrets
 * out of the repository while still supporting open-source workflows.
 */
export function getAmplifyConfig() {
  return {
    auth: {
      user_pool_id: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
      aws_region: process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1",
      user_pool_client_id:
        process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? "",
      identity_pool_id:
        process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID ?? "",
      mfa_methods: [] as string[],
      standard_required_attributes: ["email"],
      username_attributes: ["email"] as const,
      user_verification_types: ["email"],
      groups: [] as string[],
      mfa_configuration: "NONE" as const,
      password_policy: {
        min_length: 8,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: true,
        require_uppercase: true,
      },
      unauthenticated_identities_enabled: true,
    },
    version: "1.4" as const,
  };
}
