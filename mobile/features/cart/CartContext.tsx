import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useAuth } from "../auth/AuthContext"
import { addToCartRemote, getMyCartLines } from "../../lib/commerce"

type CartLine = {
  listingId: string
  quantity: number
}

type CartContextValue = {
  items: CartLine[]
  itemCount: number
  loading: boolean
  isPending: (listingId: string) => boolean
  hasListing: (listingId: string) => boolean
  quantityFor: (listingId: string) => number
  addListingToCart: (listingId: string) => Promise<CartLine>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading, configured } = useAuth()
  const userId = session?.user.id
  const [items, setItems] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const itemsRef = useRef(items)
  const pendingRef = useRef(new Set<string>())
  itemsRef.current = items

  const refreshCart = useCallback(async () => {
    if (!configured || !userId) {
      setItems([])
      return
    }
    const lines = await getMyCartLines()
    setItems(lines)
  }, [configured, userId])

  useEffect(() => {
    if (authLoading) return
    if (!configured || !userId) {
      setItems([])
      return
    }
    let cancelled = false
    setLoading(true)
    void refreshCart()
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authLoading, configured, refreshCart, userId])

  const addListingToCart = useCallback(
    async (listingId: string) => {
      const existing = itemsRef.current.find((row) => row.listingId === listingId)
      if (existing) return existing
      if (pendingRef.current.has(listingId)) {
        return itemsRef.current.find((row) => row.listingId === listingId) ?? { listingId, quantity: 1 }
      }
      pendingRef.current.add(listingId)
      setPendingIds(new Set(pendingRef.current))
      try {
        const added = await addToCartRemote(listingId)
        setItems((current) => {
          if (current.some((row) => row.listingId === added.listingId)) return current
          return [...current, added]
        })
        try {
          await refreshCart()
        } catch {
          /* keep RPC row */
        }
        return itemsRef.current.find((row) => row.listingId === added.listingId) ?? added
      } finally {
        pendingRef.current.delete(listingId)
        setPendingIds(new Set(pendingRef.current))
      }
    },
    [refreshCart],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.length,
      loading,
      isPending: (listingId) => pendingIds.has(listingId),
      hasListing: (listingId) => items.some((row) => row.listingId === listingId),
      quantityFor: (listingId) => items.find((row) => row.listingId === listingId)?.quantity ?? 0,
      addListingToCart,
      refreshCart,
    }),
    [addListingToCart, items, loading, pendingIds, refreshCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error("useCart must be used within CartProvider.")
  return value
}
