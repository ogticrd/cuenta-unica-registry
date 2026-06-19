import { notFound, redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import type { FeatureFlagAdvancedSettings } from "@/lib/services/feature-flags/feature-flags.service";

type FeatureFlagDisabledFallbackProps = {
  advancedSettings?: FeatureFlagAdvancedSettings;
};

export function FeatureFlagDisabledFallback({
  advancedSettings,
}: FeatureFlagDisabledFallbackProps) {
  if (
    advancedSettings?.behavior === "REDIRECT" &&
    advancedSettings.redirectPath
  ) {
    redirect(advancedSettings.redirectPath);
  }

  if (advancedSettings?.behavior !== "TEXT_MESSAGE") {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <section className="container mx-auto max-w-2xl px-4 text-center">
          <div className="rounded-lg border border-border bg-card px-6 py-8 text-card-foreground shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">
              {advancedSettings.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {advancedSettings.description}
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
