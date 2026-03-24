import { Home, SearchX } from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16 relative overflow-hidden">
        <div className="relative z-10 max-w-xl w-full mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 dark:bg-secondary/20 flex items-center justify-center shadow-inner">
              <SearchX
                className="w-10 h-10 text-primary dark:text-secondary"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* 404 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-[0.3em] uppercase text-primary/70 dark:text-secondary/70">
              Error 404
            </p>
            <h1 className="text-[7rem] leading-none font-extrabold bg-gradient-to-br from-primary via-primary/80 to-secondary bg-clip-text text-transparent drop-shadow-sm select-none dark:text-secondary">
              404
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full opacity-60" />
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              Página no encontrada
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Lo sentimos, la página que buscas no existe o ha sido movida.
              Verifica la URL e intenta nuevamente.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-medium shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-primary/30"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Ir al Inicio
              </Link>
            </Button>
          </div>

          {/* Subtle bottom hint */}
          <p className="text-sm text-muted-foreground/60">
            Si el problema persiste, contacta al soporte técnico.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
