import { Suspense } from "react"
import { getSettingsFlow, OryPageParams } from "@ory/nextjs/app"
import config from "@/ory.config"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import OrySettings from "./ory-settings"

async function SettingsFlowComponent({ searchParams }: OryPageParams) {
  const flow = await getSettingsFlow(config, searchParams)

  if (!flow) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Cargando configuración de seguridad...</p>
      </div>
    )
  }

  return <OrySettings flow={flow} />
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
          <Suspense
            fallback={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-blue-400 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando...</p>
              </div>
            }
          >
            <SettingsFlowComponent searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  )
}
