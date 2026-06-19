import "server-only";

import { unstable_noStore as noStore } from "next/cache";

const ACCOUNT_REGISTRATION_FLAG = "account-registration";

type FeatureFlagResponse = {
  key: string;
  enabled: boolean;
};

function getFeatureFlagsApiBaseUrl() {
  return process.env.FEATURE_FLAGS_API_BASE_URL?.replace(/\/$/, "");
}

export async function isFeatureFlagEnabled(key: string) {
  noStore();

  const baseUrl = getFeatureFlagsApiBaseUrl();

  if (!baseUrl) {
    return false;
  }

  try {
    const response = await fetch(
      `${baseUrl}/api/feature-flags/${encodeURIComponent(key)}`,
      {
        cache: "no-store",
        next: {
          revalidate: 0,
        },
      },
    );

    if (!response.ok) {
      console.error(
        `[feature-flags] API returned ${response.status} for flag "${key}"`,
      );
      return false;
    }

    const flag = (await response.json()) as FeatureFlagResponse;
    return flag.key === key && flag.enabled === true;
  } catch (error) {
    console.error(`[feature-flags] Failed to read flag "${key}":`, error);
    return false;
  }
}

export function isAccountRegistrationEnabled() {
  return isFeatureFlagEnabled(ACCOUNT_REGISTRATION_FLAG);
}
