"use client";

import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notifications/notification-context";
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
        <AuthProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </AuthProvider>
      </AmplifyProvider>
    </ThemeProvider>
  );
}
