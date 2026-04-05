import { Recovery } from "@ory/elements-react/theme";
import type { OryPageParams } from "@ory/nextjs/app";
import { Suspense } from "react";
import {
  CucRecoveryFooter,
  CucRecoveryHeader,
} from "@/components/auth/ory-components";

import { LoadingFallback } from "@/components/ui/loading-fallback";
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

  return (
    <Recovery
      flow={flow}
      config={dynamicConfig}
      components={{
        Card: {
          Header: CucRecoveryHeader,
          Footer: CucRecoveryFooter,
        },
      }}
    />
  );
}

export default async function ForgotPasswordPage(props: OryPageParams) {
  return (
    <>
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="ory-auth-scope w-full max-w-md mx-auto">
            <Suspense fallback={<LoadingFallback />}>
              <RecoveryFlow searchParams={props.searchParams} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
