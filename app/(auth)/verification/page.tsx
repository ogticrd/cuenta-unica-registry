import { Suspense } from "react"
import { Verification } from "@ory/elements-react/theme"
import { getVerificationFlow, OryPageParams } from "@ory/nextjs/app"
import { getServerOryConfig } from "@/lib/ory/server-config"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

async function VerificationFlow({ searchParams }: OryPageParams) {
  const dynamicConfig = await getServerOryConfig()
  const flow = await getVerificationFlow(dynamicConfig, searchParams)

  if (!flow) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Cargando verificación...</p>
      </div>
    )
  }

  return <Verification flow={flow} config={dynamicConfig} />
}

export default async function VerificationPage(props: OryPageParams) {
  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-md mx-auto">
            <Suspense
              fallback={
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-blue-400 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando...</p>
                </div>
              }
            >
              <VerificationFlow searchParams={props.searchParams} />
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
