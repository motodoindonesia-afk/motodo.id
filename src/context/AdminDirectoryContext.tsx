import { useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { isSupabaseConfigured } from "../lib/supabase"
import {
  clearAdminUsersCache,
  hydrateAdminUsers,
  setAdminUsersHydrated,
} from "../lib/adminUsersSupabase"

export function AdminDirectoryProvider({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAdminUsersHydrated(true)
      return
    }
    if (loading) return

    let cancelled = false

    async function hydrate() {
      if (!user || !isAdmin) {
        clearAdminUsersCache()
        setAdminUsersHydrated(true)
        return
      }
      setAdminUsersHydrated(false)
      try {
        await hydrateAdminUsers()
      } catch {
        if (!cancelled) setAdminUsersHydrated(true)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [user, loading, isAdmin])

  return children
}
