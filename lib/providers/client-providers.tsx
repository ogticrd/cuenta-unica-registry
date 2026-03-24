"use client";

import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/lib/auth-context";
import { AmplifyProvider } from "@/lib/providers/amplify-provider";

/**
 * Client Component — runs on the client.
 * Wraps children in ThemeProvider (dark/light mode), AmplifyProvider (AWS),
 * and AuthProvider (session).
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      <AmplifyProvider>
        <AuthProvider>{children}</AuthProvider>
      </AmplifyProvider>
    </ThemeProvider>
  );
}
