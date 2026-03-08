import { Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { VerifyCodeForm } from "@/components/auth/verify-code-form"

export default function VerifyCodePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <Suspense fallback={<div className="text-center">Cargando...</div>}>
            <VerifyCodeForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  )
}
