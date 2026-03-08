"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email?: string
  name?: string
  lastName?: string
  fullName?: string
  cedula?: string
  nationality?: string
  birthDate?: string
  gender?: string
  avatar?: string
  traits?: Record<string, unknown>
}

interface AuthContextType {
  user: User | null
  login: (identifier: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  isLoading: boolean
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
    nationality: (traits.nationality as string) || "",
    birthDate: (traits.birthdate as string) || "",
    gender: (traits.gender as string) || "",
    traits: identity.traits as Record<string, unknown>,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/ory/session", {
        credentials: "include",
      })
      const data = await response.json()

      if (data.isAuthenticated && data.identity) {
        setUser(mapIdentityToUser(data.identity))
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Failed to fetch session:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  /**
   * Login is handled by Ory Elements form submission.
   * This method is kept for backwards compatibility but is not
   * used when Ory Elements handles the login flow.
   * After Ory Elements completes login, the session cookie is set
   * and refreshSession() will detect the authenticated user.
   */
  const login = async (_identifier: string, _password: string): Promise<boolean> => {
    // Ory Elements handles login form submission
    // After successful login, Ory redirects and the session is set via cookies
    await refreshSession()
    return user !== null
  }

  const logout = async () => {
    try {
      const response = await fetch("/api/ory/logout", {
        method: "POST",
        credentials: "include",
      })
      const data = await response.json()

      setUser(null)

      if (data.redirect_to) {
        router.push(data.redirect_to)
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Logout error:", error)
      setUser(null)
      router.push("/login")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshSession,
        isLoading,
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
