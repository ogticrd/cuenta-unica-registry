import { Suspense } from "react"
import { getSettingsFlow, OryPageParams } from "@ory/nextjs/app"
import { LoadingFallback } from "@/components/ui/loading-fallback"
import { getT } from "@/lib/i18n/server"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import OrySettings from "./ory-settings"
import { getServerOryConfig } from "@/lib/ory/server-config"

async function SettingsFlowComponent({ searchParams }: OryPageParams) {
  const dynamicConfig = await getServerOryConfig()
  const flow = await getSettingsFlow(dynamicConfig, searchParams)
  const t = await getT("settings")

  if (!flow) {
    return <LoadingFallback message={t("loading")} />
  }

  return <OrySettings flow={flow} dynamicConfig={dynamicConfig} />
}

export default async function SettingsPage(props: OryPageParams) {
  const t = await getT("settings")
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="space-y-8 max-w-6xl">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-blue-400 mb-2">{t("title")}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>
          <Suspense fallback={<LoadingFallback />}>
            <SettingsFlowComponent searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  )
}
