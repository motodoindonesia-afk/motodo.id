import { useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { isSupabaseConfigured } from "../lib/supabase"
import {
  clearChatCache,
  hydrateConversations,
  setChatHydrated,
  subscribeToConversationUpdates,
} from "../lib/chatSupabase"

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setChatHydrated(true)
      return
    }
    if (loading) return

    let cancelled = false
    let unsubscribe: (() => void) | undefined

    async function hydrate() {
      if (!user) {
        clearChatCache()
        setChatHydrated(true)
        return
      }
      setChatHydrated(false)
      try {
        await hydrateConversations()
        if (!cancelled) unsubscribe = subscribeToConversationUpdates(user.id)
      } catch {
        if (!cancelled) setChatHydrated(true)
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
