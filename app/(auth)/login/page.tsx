import { Login } from "@ory/elements-react/theme";
import type { OryPageParams } from "@ory/nextjs/app";
import { Suspense } from "react";
import { CucCardFooter, CucCardHeader } from "@/components/auth/ory-components";
import { WelcomeSection } from "@/components/auth/welcome-section";

import { LoadingFallback } from "@/components/ui/loading-fallback";
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

  return (
    <Login
      flow={flow}
      config={dynamicConfig}
      components={{
        Card: {
          Header: CucCardHeader,
          Footer: CucCardFooter,
        },
      }}
    />
  );
}

export default async function LoginPage(props: OryPageParams) {
  return (
    <main className="flex-1">
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full mx-auto">
          {/* Welcome Section - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <WelcomeSection />
          </div>

          {/* Login Form - Ory Elements with CUC Customization */}
          <div className="flex justify-center lg:justify-end">
            <div className="ory-auth-scope w-full max-w-md">
              <Suspense fallback={<LoadingFallback />}>
                <LoginFlow searchParams={props.searchParams} />
              </Suspense>
            </div>
          </div>

          {/* Welcome Section - Shown on mobile below the form */}
          <div className="lg:hidden order-last">
            <WelcomeSection />
          </div>
        </div>
      </div>
    </main>
  );
}
