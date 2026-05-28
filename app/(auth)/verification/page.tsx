import { Verification } from "@ory/elements-react/theme";
import type { OryPageParams } from "@ory/nextjs/app";
import { Suspense } from "react";
import { JourneyEvent } from "@/components/analytics/journey-event";
import {
  CucVerificationFooter,
  CucVerificationHeader,
} from "@/components/auth/ory-components";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LoadingFallback } from "@/components/ui/loading-fallback";
import { getT } from "@/lib/i18n/server";
import { getVerificationFlow } from "@/lib/ory/flow";
import { getServerOryConfig } from "@/lib/ory/server-config";

async function VerificationFlow({ searchParams }: OryPageParams) {
  const dynamicConfig = await getServerOryConfig();
  const flow = await getVerificationFlow(dynamicConfig, searchParams);
  const t = await getT("login");

  if (!flow) {
    return <LoadingFallback message={t("loading_verification")} />;
  }

  return (
    <Verification
      flow={flow}
      config={dynamicConfig}
      components={{
        Card: {
          Header: CucVerificationHeader,
          Footer: CucVerificationFooter,
        },
      }}
    />
  );
}

export default async function VerificationPage(props: OryPageParams) {
  const params = await props.searchParams;

  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <JourneyEvent
        eventName="journey.verification.entered"
        step="verification"
        flowId={params.flow?.toString()}
        oryFlowType="verification"
      />
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-md mx-auto">
            <Suspense fallback={<LoadingFallback />}>
              <VerificationFlow searchParams={props.searchParams} />
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
