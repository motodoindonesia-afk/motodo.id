import { useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { isSupabaseConfigured } from "../lib/supabase"
import { hydrateReviews, setReviewsHydrated } from "../lib/reviewsSupabase"

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReviewsHydrated(true)
      return
    }
    if (loading) return

    let cancelled = false

    async function hydrate() {
      setReviewsHydrated(false)
      try {
        await hydrateReviews()
      } catch {
        if (!cancelled) setReviewsHydrated(true)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  return children
}
