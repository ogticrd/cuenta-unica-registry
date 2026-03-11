"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ROUTES } from "@/lib/constants/routes"
import { authService } from "@/lib/services/ory/auth.service"
import { sessionService, type OrySession } from "@/lib/services/ory/session.service"
import { useT } from "@/hooks/use-t"

interface User {
  id: string
  email?: string
  name?: string
  lastName?: string
  fullName?: string
  cedula?: string
  passport?: string
  nationality?: string
  birthDate?: string
  gender?: string
  phone?: string
  avatar?: string
  traits?: Record<string, unknown>
}

interface AuthContextType {
  user: User | null
  session: OrySession | null
  logout: () => void
  refreshSession: () => void
  isLoading: boolean
  isLoggingOut: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Map Ory identity traits to our User interface.
 * Adjust this mapping based on your Ory identity schema.
 */
function mapIdentityToUser(identity: {
  id: string
  traits?: Record<string, unknown>
}): User {
  const traits = (identity.traits || {}) as Record<string, unknown>

  // Handle name as either a string or an object { first, last }
  let firstName = ""
  let lastName = ""
  const nameVal = traits.name
  if (typeof nameVal === "object" && nameVal !== null) {
    const nameObj = nameVal as Record<string, string>
    firstName = nameObj.first || ""
    lastName = nameObj.last || ""
  } else if (typeof nameVal === "string") {
    firstName = nameVal
  }

  return {
    id: identity.id,
    email: (traits.email as string) || "",
    name: firstName,
    lastName: lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    cedula: (traits.username as string) || "",
    passport: (traits.passport as string) || "",
    nationality: (traits.nationality as string) || "",
    birthDate: (traits.birthdate as string) || "",
    gender: (traits.gender as string) || "",
    phone: (traits.phone as string) || "",
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const t = useT("auth")
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<OrySession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const refreshSession = useCallback(() => {
    sessionService
      .getSession()
      .then((data) => {
        if (data.isAuthenticated && data.identity) {
          setUser(mapIdentityToUser(data.identity))
          setSession(data.session ? { ...data.session, other_sessions: data.otherSessions ?? [] } : null)
        } else {
          setUser(null)
          setSession(null)
        }
      })
      .catch(() => {
        setUser(null)
        setSession(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const logout = () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    const toastId = toast.loading(t("logging_out"))

    authService
      .logout()
      .then((data) => {
        setUser(null)
        toast.success(t("logout_success"), { id: toastId })
        router.push(data.redirect_to ?? ROUTES.login)
      })
      .catch(() => {
        setUser(null)
        toast.error(t("logout_error"), { id: toastId })
        router.push(ROUTES.login)
      })
      .finally(() => setIsLoggingOut(false))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        logout,
        refreshSession,
        isLoading,
        isLoggingOut,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
