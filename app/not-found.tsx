import Image from "next/image"
import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function NotFound() {
  return (
    <div>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)] flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Error Code */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Página no encontrada
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Lo sentimos, la página que buscas no existe o ha sido movida.
              Verifica la URL e intenta nuevamente.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-button"
            >
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Ir al Inicio
              </Link>
            </Button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
