import { getLocale } from "next-intl/server";
import { Poppins } from "next/font/google";
import type { Metadata } from "next";
import type React from "react";

import { ClientProviders } from "@/lib/providers/client-providers";
import { ServerProviders } from "@/lib/providers/server-providers";
import { Toaster } from "@/components/ui/sonner";
import "@ory/elements-react/theme/styles.css";

import "./globals.css";
import "./ory-theme.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cuenta Única Ciudadana",
  description:
    "Plataforma Única de Autenticación Ciudadana - República Dominicana",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={poppins.className}>
        <ServerProviders>
          <ClientProviders>{children}</ClientProviders>
        </ServerProviders>
        <Toaster />
      </body>
    </html>
  );
}
