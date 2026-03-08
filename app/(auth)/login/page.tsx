import { Suspense } from "react"
import { Login } from "@ory/elements-react/theme"
import { getLoginFlow, OryPageParams } from "@ory/nextjs/app"
import config from "@/ory.config"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { WelcomeSection } from "@/components/auth/welcome-section"
import {
  CucCardHeader,
  CucCardFooter,
} from "@/components/auth/ory-components"

async function LoginFlow({ searchParams }: OryPageParams) {
  const flow = await getLoginFlow(config, searchParams)

  if (!flow) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Cargando formulario de acceso...</p>
      </div>
    )
  }

  return (
    <Login
      flow={flow}
      config={config}
      components={{
        Card: {
          Header: CucCardHeader,
          Footer: CucCardFooter,
        },
      }}
    />
  )
}

export default async function LoginPage(props: OryPageParams) {
  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff]">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full mx-auto">
            {/* Welcome Section - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block">
              <WelcomeSection />
            </div>

            {/* Login Form - Ory Elements with CUC Customization */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <Suspense
                  fallback={
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-gray-600">Cargando...</p>
                    </div>
                  }
                >
                  <LoginFlow
                    searchParams={props.searchParams}
                  />
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

      <Footer />
    </div>
  )
}
