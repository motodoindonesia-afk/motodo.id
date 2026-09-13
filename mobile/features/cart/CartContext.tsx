import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  addToCartRemote,
  clearCartRemote,
  getMyCartLines,
  removeFromCartRemote,
  updateCartQuantityRemote,
  type CartLine,
} from "../../lib/commerce"
import { useAuth } from "../auth/AuthContext"

type CartContextValue = {
  items: CartLine[]
  itemCount: number
  loading: boolean
  clearing: boolean
  isPending: (listingId: string) => boolean
  hasListing: (listingId: string) => boolean
  quantityFor: (listingId: string) => number
  addListingToCart: (listingId: string) => Promise<CartLine>
  removeListingFromCart: (listingId: string) => Promise<void>
  setListingQuantity: (listingId: string, quantity: number) => Promise<CartLine>
  emptyCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

function upsertItem(items: CartLine[], item: CartLine) {
  const index = items.findIndex((row) => row.listingId === item.listingId)
  if (index < 0) return [item, ...items]
  const next = [...items]
  next[index] = { ...next[index], ...item }
  return next
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading, configured } = useAuth()
  const userId = session?.user.id
  const [items, setItems] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
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
      pendingRef.current = new Set()
      setPendingIds(new Set())
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

  function beginPending(listingId: string) {
    if (pendingRef.current.has(listingId)) return false
    pendingRef.current.add(listingId)
    setPendingIds(new Set(pendingRef.current))
    return true
  }

  function endPending(listingId: string) {
    pendingRef.current.delete(listingId)
    setPendingIds(new Set(pendingRef.current))
  }

  const addListingToCart = useCallback(
    async (listingId: string) => {
      const existing = itemsRef.current.find((row) => row.listingId === listingId)
      if (existing) return existing
      if (!beginPending(listingId)) {
        return itemsRef.current.find((row) => row.listingId === listingId) ?? { id: "", listingId, quantity: 1 }
      }
      try {
        const added = await addToCartRemote(listingId)
        setItems((current) => upsertItem(current, added))
        try {
          await refreshCart()
        } catch {
          /* keep RPC row */
        }
        return itemsRef.current.find((row) => row.listingId === added.listingId) ?? added
      } finally {
        endPending(listingId)
      }
    },
    [refreshCart],
  )

  const removeListingFromCart = useCallback(
    async (listingId: string) => {
      if (!beginPending(listingId)) return
      try {
        await removeFromCartRemote(listingId)
        setItems((current) => current.filter((row) => row.listingId !== listingId))
        try {
          await refreshCart()
        } catch {
          /* keep local removal */
        }
      } finally {
        endPending(listingId)
      }
    },
    [refreshCart],
  )

  const setListingQuantity = useCallback(
    async (listingId: string, quantity: number) => {
      const existing = itemsRef.current.find((row) => row.listingId === listingId)
      if (!existing) throw new Error("Unable to update cart.")
      if (!beginPending(listingId)) return existing
      setItems((current) =>
        current.map((row) => (row.listingId === listingId ? { ...row, quantity } : row)),
      )
      try {
        const updated = await updateCartQuantityRemote(listingId, quantity)
        setItems((current) => upsertItem(current, updated))
        try {
          await refreshCart()
        } catch {
          /* keep RPC row */
        }
        return itemsRef.current.find((row) => row.listingId === listingId) ?? updated
      } catch (error) {
        setItems((current) => upsertItem(current, existing))
        throw error
      } finally {
        endPending(listingId)
      }
    },
    [refreshCart],
  )

  const emptyCart = useCallback(async () => {
    setClearing(true)
    try {
      await clearCartRemote()
      setItems([])
    } finally {
      setClearing(false)
    }
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.length,
      loading,
      clearing,
      isPending: (listingId) => pendingIds.has(listingId) || clearing,
      hasListing: (listingId) => items.some((row) => row.listingId === listingId),
      quantityFor: (listingId) => items.find((row) => row.listingId === listingId)?.quantity ?? 0,
      addListingToCart,
      removeListingFromCart,
      setListingQuantity,
      emptyCart,
      refreshCart,
    }),
    [addListingToCart, clearing, emptyCart, items, loading, pendingIds, refreshCart, removeListingFromCart, setListingQuantity],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error("useCart must be used within CartProvider.")
  return value
}
