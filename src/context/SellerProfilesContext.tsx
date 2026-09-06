import { useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { isSupabaseConfigured } from "../lib/supabase"
import {
  clearSellerProfileCache,
  hydrateSellerProfiles,
  setSellerProfilesHydrated,
} from "../lib/sellerProfiles"

export function SellerProfilesProvider({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSellerProfilesHydrated(true)
      return
    }
    if (loading) return

    let cancelled = false

    async function hydrate() {
      if (!user) {
        clearSellerProfileCache()
        setSellerProfilesHydrated(true)
        return
      }

      setSellerProfilesHydrated(false)
      try {
        await hydrateSellerProfiles({
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          isAdmin,
        })
      } catch {
        if (!cancelled) setSellerProfilesHydrated(true)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [user, loading, isAdmin])

  return children
}
