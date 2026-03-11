import { Suspense } from "react"
import { Registration } from "@ory/elements-react/theme"
import { LoadingFallback } from "@/components/ui/loading-fallback"
import { getRegistrationFlow, OryPageParams } from "@ory/nextjs/app"
import { getServerOryConfig } from "@/lib/ory/server-config"
import { getTranslations } from "next-intl/server"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

async function RegistrationFlow({ searchParams }: OryPageParams) {
  const dynamicConfig = await getServerOryConfig()
  const flow = await getRegistrationFlow(dynamicConfig, searchParams)
  const t = await getTranslations("login")

  if (!flow) {
    return <LoadingFallback message={t("loading_register")} />
  }

  return <Registration flow={flow} config={dynamicConfig} />
}

export default async function RegistrationPage(props: OryPageParams) {
  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-md mx-auto">
            <Suspense fallback={<LoadingFallback />}>
              <RegistrationFlow searchParams={props.searchParams} />
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
