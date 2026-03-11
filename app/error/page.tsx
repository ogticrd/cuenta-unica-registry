import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { oryClient } from "@/lib/ory/client"
import { ROUTES } from "@/lib/constants/routes"

interface ErrorPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

interface OryFlowErrorDetails {
  reason?: string
  message?: string
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams
  const flowId = firstParam(params.id)

  let reason = "No se pudo completar el flujo de autenticación."
  let details = "Intenta nuevamente desde la pantalla de inicio de sesión."

  if (flowId) {
    try {
      const { data } = await oryClient.getFlowError({ id: flowId })
      const flowError = data.error as OryFlowErrorDetails | undefined

      if (flowError) {
        reason = flowError.reason || flowError.message || reason
        details = flowError.message || details
      }
    } catch {
      // Keep generic copy if Ory error details are unavailable.
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center dark:bg-destructive/25">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-destructive/70 dark:text-destructive">Error</p>
            <h1 className="text-2xl font-bold">Ocurrió un problema de autenticación</h1>
            <p className="text-muted-foreground">{reason}</p>
            <p className="text-sm text-muted-foreground">{details}</p>
          </div>

          <Button asChild>
            <Link href={ROUTES.login}>Volver al inicio de sesión</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
