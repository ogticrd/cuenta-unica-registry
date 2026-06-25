import type { OryPageParams } from "@ory/nextjs/app";
import { Suspense } from "react";
import { JourneyEvent } from "@/components/analytics/journey-event";
import { OryRecoveryCard } from "@/components/auth/ory-flow-cards";

import { LoadingFallback } from "@/components/ui/loading-fallback";
import { buildAnalyticsContextStartPath } from "@/lib/analytics/client-launch-core";
import {
  type OryFlowLike,
  resolveAnalyticsTransientPayloadForFlow,
} from "@/lib/analytics/transient-payload-core";
import { getT } from "@/lib/i18n/server";
import { getRecoveryFlow } from "@/lib/ory/flow";
import { getServerOryConfig } from "@/lib/ory/server-config";

async function RecoveryFlow({ searchParams }: OryPageParams) {
  const dynamicConfig = await getServerOryConfig();
  const flow = await getRecoveryFlow(dynamicConfig, searchParams);
  const t = await getT("login");

  if (!flow) {
    return <LoadingFallback message={t("loading_recovery")} />;
  }

  const analytics = resolveAnalyticsTransientPayloadForFlow(
    flow as unknown as OryFlowLike,
    undefined,
  )?.analytics;
  const loginHref = buildAnalyticsContextStartPath({
    clientId: analytics?.clientId,
    entryPath: "/login",
    returnUrl: analytics?.returnUrl,
  });

  return (
    <>
      <JourneyEvent
        eventName="journey.recovery.entered"
        step="recovery"
        flowId={flow.id}
        oryFlowType="recovery"
        clientId={analytics?.clientId}
        clientName={analytics?.clientName}
        institutionName={analytics?.institutionName}
        linkageStatus={analytics?.linkageStatus}
        returnUrl={analytics?.returnUrl}
      />
      <OryRecoveryCard
        flow={flow}
        dynamicConfig={dynamicConfig}
        loginHref={loginHref}
      />
    </>
  );
}

export default async function ForgotPasswordPage(props: OryPageParams) {
  return (
    <main className="flex-1 flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        <div className="ory-auth-scope w-full max-w-md mx-auto">
          <Suspense fallback={<LoadingFallback />}>
            <RecoveryFlow searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
