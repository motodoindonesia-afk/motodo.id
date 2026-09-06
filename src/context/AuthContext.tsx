import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  getCurrentUser,
  login as mockLogin,
  logout as mockLogout,
  signup as mockSignup,
  updateCurrentUser,
} from "../lib/auth"
import { ensureDevAdminUser, isAdmin as userIsAdmin } from "../lib/admin"
import { ensureSeededSellers, ensureSeededSellerAccounts } from "../lib/seller"
import { ensureSeededListings } from "../lib/listings"
import { isMockMarketplaceAllowed, isSupabaseConfigured } from "../lib/supabase"
import {
  loadSessionUser,
  subscribeSupabaseAuth,
  supabaseLogin,
  supabaseLogout,
  supabaseSignup,
  supabaseUpdateProfile,
} from "../lib/supabaseAuth"
import type { AuthUser, LoginInput, SignupInput, UserRole } from "../types/auth"
import type { MotodoProfile } from "../types/profile"

type AuthContextValue = {
  user: AuthUser | null
  profile: MotodoProfile | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  accountType: UserRole | null
  login: (input: LoginInput) => Promise<AuthUser>
  signup: (input: SignupInput) => Promise<AuthUser>
  logout: () => void
  signOut: () => void
  updateProfile: (patch: Partial<Pick<AuthUser, "fullName" | "role" | "phone">>) => Promise<AuthUser | null>
  refresh: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mockProfileFromUser(user: AuthUser | null): MotodoProfile | null {
  if (!user) return null
  const admin = userIsAdmin(user)
  return {
    id: user.id,
    fullName: user.fullName,
    accountType: user.role,
    role: admin ? "admin" : "user",
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
  }
}

function seedMockMarketplace() {
  ensureSeededSellerAccounts()
  ensureSeededSellers()
  ensureSeededListings()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseMode = isSupabaseConfigured()
  const mockMode = isMockMarketplaceAllowed()
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (supabaseMode) return null
    if (!mockMode) return null
    seedMockMarketplace()
    ensureDevAdminUser()
    return getCurrentUser()
  })
  const [profile, setProfile] = useState<MotodoProfile | null>(() =>
    mockMode ? mockProfileFromUser(getCurrentUser()) : null,
  )
  const [loading, setLoading] = useState(supabaseMode)

  useEffect(() => {
    if (!supabaseMode) return

    let cancelled = false

    async function hydrate() {
      try {
        const session = await loadSessionUser()
        if (cancelled) return
        setUser(session?.user ?? null)
        setProfile(session?.profile ?? null)
      } catch {
        if (!cancelled) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void hydrate()
    const unsubscribe = subscribeSupabaseAuth(() => {
      void hydrate()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [supabaseMode])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: user !== null,
      isAdmin: userIsAdmin(user),
      accountType: profile?.accountType ?? user?.role ?? null,
      async login(input) {
        if (supabaseMode) {
          const next = await supabaseLogin(input)
          setUser(next.user)
          setProfile(next.profile)
          return next.user
        }
        if (!mockMode) throw new Error("This environment is not configured.")
        const next = await mockLogin(input)
        setUser(next)
        setProfile(mockProfileFromUser(next))
        return next
      },
      async signup(input) {
        if (supabaseMode) {
          const next = await supabaseSignup(input)
          setUser(next.user)
          setProfile(next.profile)
          return next.user
        }
        if (!mockMode) throw new Error("This environment is not configured.")
        const next = await mockSignup(input)
        setUser(next)
        setProfile(mockProfileFromUser(next))
        return next
      },
      logout() {
        if (supabaseMode) {
          void supabaseLogout().finally(() => {
            setUser(null)
            setProfile(null)
          })
          return
        }
        mockLogout()
        setUser(null)
        setProfile(null)
      },
      signOut() {
        if (supabaseMode) {
          void supabaseLogout().finally(() => {
            setUser(null)
            setProfile(null)
          })
          return
        }
        mockLogout()
        setUser(null)
        setProfile(null)
      },
      async updateProfile(patch) {
        if (supabaseMode) {
          const nextProfile = await supabaseUpdateProfile({
            fullName: patch.fullName,
            accountType: patch.role,
          })
          const nextUser: AuthUser = {
            id: nextProfile.id,
            fullName: nextProfile.fullName,
            email: user?.email ?? "",
            role: nextProfile.accountType,
            privilege: nextProfile.role,
            createdAt: nextProfile.createdAt,
            phone: user?.phone,
          }
          setProfile(nextProfile)
          setUser(nextUser)
          return nextUser
        }
        const next = updateCurrentUser(patch)
        if (next) {
          setUser(next)
          setProfile(mockProfileFromUser(next))
        }
        return next
      },
      refresh() {
        if (supabaseMode) {
          void loadSessionUser()
            .then((session) => {
              setUser(session?.user ?? null)
              setProfile(session?.profile ?? null)
            })
            .catch(() => {
              setUser(null)
              setProfile(null)
            })
          return
        }
        const next = getCurrentUser()
        setUser(next)
        setProfile(mockProfileFromUser(next))
      },
    }),
    [loading, mockMode, profile, supabaseMode, user],
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
