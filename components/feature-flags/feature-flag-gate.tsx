import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import type { FeatureFlag } from "@/lib/services/feature-flags/feature-flags.service";

type FeatureFlagGateProps = {
  flag: FeatureFlag | null;
  children: ReactNode;
  fallback?: ReactNode;
};

export function FeatureFlagGate({
  flag,
  children,
  fallback = null,
}: FeatureFlagGateProps) {
  if (flag?.enabled) {
    return children;
  }

  const advancedSettings = flag?.advancedSettings;

  if (
    advancedSettings?.behavior === "REDIRECT" &&
    advancedSettings.redirectPath
  ) {
    redirect(advancedSettings.redirectPath);
  }

  if (advancedSettings?.behavior === "TEXT_MESSAGE") {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-card-foreground">
        <p className="text-sm font-semibold">{advancedSettings.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {advancedSettings.description}
        </p>
      </div>
    );
  }

  return fallback;
}
