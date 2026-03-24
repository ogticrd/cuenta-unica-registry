"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const details =
    error?.message?.trim() || "Intenta nuevamente en unos minutos.";

  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="bg-white dark:bg-background border-b border-gray-200 dark:border-border">
          <div className="container w-full mx-auto px-4">
            <div className="flex items-center h-16">
              <Image
                src="/images/cuenta-unica-logo.png"
                alt="Cuenta Unica"
                width={210}
                height={104}
                className="h-10 w-auto"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-xl w-full mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center dark:bg-destructive/25">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-destructive/70 dark:text-destructive">
                Error
              </p>
              <h1 className="text-2xl font-bold">
                Ocurrió un problema inesperado
              </h1>
              <p className="text-muted-foreground">
                No pudimos cargar la aplicación correctamente.
              </p>
              <p className="text-sm text-accent p-3 rounded-md bg-accent/10 mt-2">
                {details}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={reset}>
                Reintentar
              </Button>
              <Button asChild>
                <Link href={ROUTES.login}>Volver al inicio de sesión</Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
