"use client"

// import { SessionProvider } from "@ory/elements-react/client"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
        >
            {/* <SessionProvider> */}
            <AuthProvider>
                {children}
            </AuthProvider>
            {/* </SessionProvider> */}
        </ThemeProvider>
    )
}
