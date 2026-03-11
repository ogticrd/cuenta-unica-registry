"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
  session: Record<string, any> | null
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
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
  console.log("traits", traits)
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
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Record<string, any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/ory/session", {
        credentials: "include",
      })
      const data = await response.json()

      if (data.isAuthenticated && data.identity) {
        setUser(mapIdentityToUser(data.identity))
        setSession(data.session ? { ...data.session, other_sessions: data.otherSessions || [] } : null)
      } else {
        setUser(null)
        setSession(null)
      }
    } catch (error) {
      console.error("Failed to fetch session:", error)
      setUser(null)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const logout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    const toastId = toast.loading("Cerrando sesión...")
    try {
      const response = await fetch("/api/ory/logout", {
        method: "POST",
        credentials: "include",
      })
      const data = await response.json()

      setUser(null)
      toast.success("Sesión cerrada correctamente", { id: toastId })

      if (data.redirect_to) {
        router.push(data.redirect_to)
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Logout error:", error)
      setUser(null)
      toast.error("Error al cerrar sesión", { id: toastId })
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
    }
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
