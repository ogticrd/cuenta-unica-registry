import { Suspense } from "react"
import { Recovery } from "@ory/elements-react/theme"
import { getRecoveryFlow, OryPageParams } from "@ory/nextjs/app"
import config from "@/ory.config"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import {
  CucRecoveryHeader,
  CucRecoveryFooter,
} from "@/components/auth/ory-components"

async function RecoveryFlow({ searchParams }: OryPageParams) {
  const flow = await getRecoveryFlow(config, searchParams)

  if (!flow) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Cargando formulario de recuperación...</p>
      </div>
    )
  }

  return (
    <Recovery
      flow={flow}
      config={config}
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
    <div className="min-h-screen flex flex-col bg-[#eff7ff]">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-md mx-auto">
            <Suspense
              fallback={
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando...</p>
                </div>
              }
            >
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

