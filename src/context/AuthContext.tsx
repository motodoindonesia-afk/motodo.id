import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
  updateCurrentUser,
} from "../lib/auth"
import { ensureDevAdminUser } from "../lib/admin"
import { ensureSeededSellers, ensureSeededSellerAccounts } from "../lib/seller"
import { ensureSeededListings } from "../lib/listings"
import type { AuthUser, LoginInput, SignupInput } from "../types/auth"

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<AuthUser>
  signup: (input: SignupInput) => Promise<AuthUser>
  logout: () => void
  updateProfile: (patch: Partial<Pick<AuthUser, "fullName" | "role">>) => AuthUser | null
  refresh: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    ensureDevAdminUser()
    ensureSeededSellerAccounts()
    ensureSeededSellers()
    ensureSeededListings()
    return getCurrentUser()
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      async login(input) {
        const next = await loginRequest(input)
        setUser(next)
        return next
      },
      async signup(input) {
        const next = await signupRequest(input)
        setUser(next)
        return next
      },
      logout() {
        logoutRequest()
        setUser(null)
      },
      updateProfile(patch) {
        const next = updateCurrentUser(patch)
        if (next) setUser(next)
        return next
      },
      refresh() {
        setUser(getCurrentUser())
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
