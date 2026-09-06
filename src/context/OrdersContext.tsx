import { useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { isSupabaseConfigured } from "../lib/supabase"
import { clearOrderCache, hydrateOrders, setOrdersHydrated } from "../lib/ordersSupabase"

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setOrdersHydrated(true)
      return
    }
    if (loading) return

    let cancelled = false

    async function hydrate() {
      if (!user) {
        clearOrderCache()
        setOrdersHydrated(true)
        return
      }
      setOrdersHydrated(false)
      try {
        await hydrateOrders()
      } catch {
        if (!cancelled) setOrdersHydrated(true)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  return children
}
