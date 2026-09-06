import { useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { isSupabaseConfigured } from "../lib/supabase"
import { hydrateListings, setListingsHydrated } from "../lib/listingsSupabase"

export function ListingsProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setListingsHydrated(true)
      return
    }
    if (loading) return

    let cancelled = false

    async function hydrate() {
      setListingsHydrated(false)
      try {
        await hydrateListings()
      } catch {
        if (!cancelled) setListingsHydrated(true)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  return children
}
