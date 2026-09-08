import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { getMyFavorites, toggleFavorite as toggleFavoriteRemote } from "../lib/favoritesSupabase"
import { isSupabaseConfigured } from "../lib/supabase"
import { useAuth } from "./AuthContext"

type FavoritesContextValue = {
  listingIds: ReadonlySet<string>
  loading: boolean
  isFavorited: (listingId: string) => boolean
  isPending: (listingId: string) => boolean
  toggleListingFavorite: (listingId: string) => Promise<boolean>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [listingIds, setListingIds] = useState<Set<string>>(() => new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(false)
  const pendingRef = useRef(new Set<string>())
  const idsRef = useRef(listingIds)
  idsRef.current = listingIds

  useEffect(() => {
    if (authLoading) return

    if (!isSupabaseConfigured() || !user) {
      setListingIds(new Set())
      setPendingIds(new Set())
      pendingRef.current = new Set()
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void getMyFavorites()
      .then((favorites) => {
        if (cancelled) return
        setListingIds(new Set(favorites.map((item) => item.listingId)))
      })
      .catch(() => {
        if (cancelled) return
        setListingIds(new Set())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  const toggleListingFavorite = useCallback(async (listingId: string) => {
    if (!isSupabaseConfigured() || !user) return false
    if (pendingRef.current.has(listingId)) return idsRef.current.has(listingId)

    const previous = idsRef.current.has(listingId)
    pendingRef.current.add(listingId)
    setPendingIds(new Set(pendingRef.current))
    setListingIds((current) => {
      const next = new Set(current)
      if (previous) next.delete(listingId)
      else next.add(listingId)
      return next
    })

    try {
      const result = await toggleFavoriteRemote(listingId)
      setListingIds((current) => {
        const next = new Set(current)
        if (result.favorited) next.add(result.listingId)
        else next.delete(result.listingId)
        return next
      })
      return result.favorited
    } catch (error) {
      setListingIds((current) => {
        const next = new Set(current)
        if (previous) next.add(listingId)
        else next.delete(listingId)
        return next
      })
      throw error
    } finally {
      pendingRef.current.delete(listingId)
      setPendingIds(new Set(pendingRef.current))
    }
  }, [user])

  const value = useMemo<FavoritesContextValue>(
    () => ({
      listingIds,
      loading,
      isFavorited: (listingId: string) => listingIds.has(listingId),
      isPending: (listingId: string) => pendingIds.has(listingId),
      toggleListingFavorite,
    }),
    [listingIds, loading, pendingIds, toggleListingFavorite],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const value = useContext(FavoritesContext)
  if (!value) throw new Error("useFavorites must be used within FavoritesProvider")
  return value
}
