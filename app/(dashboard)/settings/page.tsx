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
      <div className="space-y-8">
        <div className="space-y-4 pb-8 border-b dark:border-border">
          <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <Suspense fallback={<LoadingFallback />}>
          <SettingsFlowComponent searchParams={props.searchParams} />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
