import type React from "react"
import type { Metadata } from "next"

import { Poppins } from "next/font/google"
import "./globals.css"
import "@ory/elements-react/theme/styles.css"
import "../styles/ory-theme.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Cuenta Única Ciudadana",
  description: "Plataforma Única de Autenticación Ciudadana - República Dominicana",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={poppins.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )

}
