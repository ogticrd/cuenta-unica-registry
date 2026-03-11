import { Suspense } from "react"
import { getSettingsFlow, OryPageParams } from "@ory/nextjs/app"
import { LoadingFallback } from "@/components/ui/loading-fallback"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import OrySettings from "./ory-settings"
import { getServerOryConfig } from "@/lib/ory/server-config"

async function SettingsFlowComponent({ searchParams }: OryPageParams) {
  const dynamicConfig = await getServerOryConfig()
  const flow = await getSettingsFlow(dynamicConfig, searchParams)

  if (!flow) {
    return <LoadingFallback message="Cargando configuración de seguridad..." />
  }

  return <OrySettings flow={flow} dynamicConfig={dynamicConfig} />
}

export default async function SettingsPage(props: OryPageParams) {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="space-y-8 max-w-6xl">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-blue-400 mb-2">Privacidad y seguridad</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administra tu contraseña, autenticación de dos factores y otros factores de seguridad.
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
