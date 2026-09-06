import { useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { isSupabaseConfigured } from "../lib/supabase"
import {
  clearNotificationCache,
  hydrateNotifications,
  setNotificationsHydrated,
  subscribeToNotifications,
} from "../lib/notificationsSupabase"

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setNotificationsHydrated(true)
      return
    }
    if (loading) return

    let cancelled = false
    let unsubscribe: (() => void) | undefined

    async function hydrate() {
      if (!user) {
        clearNotificationCache()
        setNotificationsHydrated(true)
        return
      }
      setNotificationsHydrated(false)
      try {
        await hydrateNotifications()
        if (!cancelled) unsubscribe = subscribeToNotifications(user.id)
      } catch {
        if (!cancelled) setNotificationsHydrated(true)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [user, loading])

  return children
}
