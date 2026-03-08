import { Suspense } from "react"
import { Settings } from "@ory/elements-react/theme"
import { getSettingsFlow, OryPageParams } from "@ory/nextjs/app"
import config from "@/ory.config"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Settings as SettingsIcon } from "lucide-react"

async function SettingsFlowComponent({ searchParams }: OryPageParams) {
  const flow = await getSettingsFlow(config, searchParams)

  if (!flow) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Cargando configuración de seguridad...</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <CardTitle>Configuración de Seguridad y Cuenta</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* We use the imported Settings component from @ory/elements-react/theme */}
        <Settings flow={flow as any} config={config} />
      </CardContent>
    </Card>
  )
}

export default async function PrivacyPage(props: OryPageParams) {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Security Settings Area */}
        <div className="space-y-8 max-w-6xl">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">Privacidad y seguridad</h1>
            <p className="text-gray-600">
              Administra tu contraseña, autenticación de dos factores y otros factores de seguridad.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando...</p>
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
