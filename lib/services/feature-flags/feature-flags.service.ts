import "server-only";

import { unstable_noStore as noStore } from "next/cache";

const ACCOUNT_REGISTRATION_FLAG = "account-registration";

export type FeatureFlagFallbackBehavior = "NONE" | "REDIRECT" | "TEXT_MESSAGE";

export type FeatureFlagAdvancedSettings = {
  behavior: FeatureFlagFallbackBehavior;
  redirectPath?: string;
  title?: string;
  description?: string;
};

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  advancedSettings?: FeatureFlagAdvancedSettings;
};

type FeatureFlagResponse = {
  key: string;
  enabled: boolean;
  advancedSettings?: unknown;
};

function getFeatureFlagsApiBaseUrl() {
  return process.env.FEATURE_FLAGS_API_BASE_URL?.replace(/\/$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeInternalPath(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const path = value.trim();

  if (!path.startsWith("/") || path.startsWith("//")) {
    return undefined;
  }

  return path;
}

function normalizeAdvancedSettings(
  value: unknown,
): FeatureFlagAdvancedSettings | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value.behavior === "NONE") {
    return { behavior: "NONE" };
  }

  if (value.behavior === "REDIRECT") {
    const redirectPath = normalizeInternalPath(value.redirectPath);

    return redirectPath ? { behavior: "REDIRECT", redirectPath } : undefined;
  }

  if (value.behavior === "TEXT_MESSAGE") {
    const title = typeof value.title === "string" ? value.title.trim() : "";
    const description =
      typeof value.description === "string" ? value.description.trim() : "";

    return title && description
      ? { behavior: "TEXT_MESSAGE", title, description }
      : undefined;
  }

  return undefined;
}

export function getDisabledFeatureFallback(
  flag: FeatureFlag | null,
): FeatureFlagAdvancedSettings {
  return flag?.advancedSettings ?? { behavior: "NONE" };
}

export async function getFeatureFlag(key: string): Promise<FeatureFlag | null> {
  noStore();

  const baseUrl = getFeatureFlagsApiBaseUrl();

  if (!baseUrl) {
    return null;
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
      return null;
    }

    const flag = (await response.json()) as FeatureFlagResponse;
    if (flag.key !== key) {
      return null;
    }

    return {
      key: flag.key,
      enabled: flag.enabled === true,
      advancedSettings: normalizeAdvancedSettings(flag.advancedSettings),
    };
  } catch (error) {
    console.error(`[feature-flags] Failed to read flag "${key}":`, error);
    return null;
  }
}

export async function isFeatureFlagEnabled(key: string) {
  const flag = await getFeatureFlag(key);

  return flag?.enabled === true;
}

export async function getAccountRegistrationFeatureFlag() {
  const flag = await getFeatureFlag(ACCOUNT_REGISTRATION_FLAG);

  if (!flag) {
    return {
      key: ACCOUNT_REGISTRATION_FLAG,
      enabled: false,
      advancedSettings: { behavior: "NONE" },
    } satisfies FeatureFlag;
  }

  return flag;
}

export function isAccountRegistrationEnabled() {
  return isFeatureFlagEnabled(ACCOUNT_REGISTRATION_FLAG);
}
