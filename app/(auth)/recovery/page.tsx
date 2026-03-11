import { Suspense } from "react"
import { Recovery } from "@ory/elements-react/theme"
import { LoadingFallback } from "@/components/ui/loading-fallback"
import { getRecoveryFlow, OryPageParams } from "@ory/nextjs/app"
import { getServerOryConfig } from "@/lib/ory/server-config"
import { getT } from "@/lib/i18n/server"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import {
  CucRecoveryHeader,
  CucRecoveryFooter,
} from "@/components/auth/ory-components"

async function RecoveryFlow({ searchParams }: OryPageParams) {
  const dynamicConfig = await getServerOryConfig()
  const flow = await getRecoveryFlow(dynamicConfig, searchParams)
  const t = await getT("login")

  if (!flow) {
    return <LoadingFallback message={t("loading_recovery")} />
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
  )
}

export default async function ForgotPasswordPage(props: OryPageParams) {
  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-md mx-auto">
            <Suspense fallback={<LoadingFallback />}>
              <RecoveryFlow
                searchParams={props.searchParams}
              />
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

