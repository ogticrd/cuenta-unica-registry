import type { OryPageParams } from "@ory/nextjs/app";
import { Suspense } from "react";
import { JourneyEvent } from "@/components/analytics/journey-event";
import { OryLoginCard } from "@/components/auth/ory-flow-cards";

import { LoadingFallback } from "@/components/ui/loading-fallback";
import { buildAnalyticsContextStartPath } from "@/lib/analytics/client-launch-core";
import {
  type OryFlowLike,
  resolveAnalyticsTransientPayloadForFlow,
} from "@/lib/analytics/transient-payload-core";
import { getT } from "@/lib/i18n/server";
import { getLoginFlow } from "@/lib/ory/flow";
import { getServerOryConfig } from "@/lib/ory/server-config";

async function LoginFlow({ searchParams }: OryPageParams) {
  const dynamicConfig = await getServerOryConfig();
  const flow = await getLoginFlow(dynamicConfig, searchParams);
  const t = await getT("login");

  if (!flow) {
    return <LoadingFallback message={t("loading")} />;
  }

  const analytics = resolveAnalyticsTransientPayloadForFlow(
    flow as unknown as OryFlowLike,
    undefined,
  )?.analytics;
  const registerHref = buildAnalyticsContextStartPath({
    clientId: analytics?.clientId,
    entryPath: "/register",
    returnUrl: analytics?.returnUrl,
  });
  const recoveryHref = buildAnalyticsContextStartPath({
    clientId: analytics?.clientId,
    entryPath: "/recovery",
    returnUrl: analytics?.returnUrl,
  });
  const verificationHref = buildAnalyticsContextStartPath({
    clientId: analytics?.clientId,
    entryPath: "/verification",
    returnUrl: analytics?.returnUrl,
  });

  return (
    <>
      <JourneyEvent
        eventName="journey.login.entered"
        step="login"
        flowId={flow.id}
        oryFlowType="login"
        clientId={analytics?.clientId}
        clientName={analytics?.clientName}
        institutionName={analytics?.institutionName}
        linkageStatus={analytics?.linkageStatus}
        returnUrl={analytics?.returnUrl}
      />
      <OryLoginCard
        flow={flow}
        dynamicConfig={dynamicConfig}
        recoveryHref={recoveryHref}
        registerHref={registerHref}
        verificationHref={verificationHref}
      />
    </>
  );
}

export default async function LoginPage(props: OryPageParams) {
  return (
    <main className="flex-1 flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        <div className="ory-auth-scope w-full max-w-md mx-auto">
          <Suspense fallback={<LoadingFallback />}>
            <LoginFlow searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
