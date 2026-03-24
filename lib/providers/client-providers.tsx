"use client";

import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/lib/auth-context";

/**
 * Client Component — runs on the client.
 * Wraps children in ThemeProvider (dark/light mode) and AuthProvider (session).
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      {/* <SessionProvider> */}
      <AuthProvider>{children}</AuthProvider>
      {/* </SessionProvider> */}
    </ThemeProvider>
  );
}
