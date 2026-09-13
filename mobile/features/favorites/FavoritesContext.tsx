import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useAuth } from "../auth/AuthContext"
import { getMyFavoriteListingIds, toggleFavoriteRemote } from "../../lib/commerce"

type FavoritesContextValue = {
  listingIds: ReadonlySet<string>
  isFavorited: (listingId: string) => boolean
  toggleListingFavorite: (listingId: string) => Promise<boolean>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading, configured } = useAuth()
  const userId = session?.user.id
  const [listingIds, setListingIds] = useState<Set<string>>(() => new Set())
  const pendingRef = useRef(new Set<string>())
  const idsRef = useRef(listingIds)
  idsRef.current = listingIds

  useEffect(() => {
    if (authLoading) return
    if (!configured || !userId) {
      setListingIds(new Set())
      pendingRef.current = new Set()
      return
    }

    let cancelled = false
    void getMyFavoriteListingIds()
      .then((ids) => {
        if (!cancelled) setListingIds(new Set(ids))
      })
      .catch(() => {
        if (!cancelled) setListingIds(new Set())
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, configured, userId])

  const toggleListingFavorite = useCallback(async (listingId: string) => {
    if (!configured || !userId) return false
    if (pendingRef.current.has(listingId)) return idsRef.current.has(listingId)

    const previous = idsRef.current.has(listingId)
    pendingRef.current.add(listingId)
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
    }
  }, [configured, userId])

  const value = useMemo<FavoritesContextValue>(
    () => ({
      listingIds,
      isFavorited: (listingId) => listingIds.has(listingId),
      toggleListingFavorite,
    }),
    [listingIds, toggleListingFavorite],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const value = useContext(FavoritesContext)
  if (!value) throw new Error("useFavorites must be used within FavoritesProvider.")
  return value
}
