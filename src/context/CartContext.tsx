import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  addToCart as addToCartRemote,
  clearCart as clearCartRemote,
  getMyCart,
  removeFromCart as removeFromCartRemote,
  updateCartQuantity as updateCartQuantityRemote,
} from "../lib/cartSupabase"
import { isSupabaseConfigured } from "../lib/supabase"
import type { CartItem } from "../types/cart"
import { useAuth } from "./AuthContext"

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  loading: boolean
  isPending: (listingId: string) => boolean
  hasListing: (listingId: string) => boolean
  addListingToCart: (listingId: string) => Promise<CartItem>
  removeListingFromCart: (listingId: string) => Promise<void>
  setListingQuantity: (listingId: string, quantity: number) => Promise<CartItem>
  emptyCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

function upsertItem(items: CartItem[], item: CartItem) {
  const index = items.findIndex((row) => row.listingId === item.listingId)
  if (index < 0) return [item, ...items]
  const next = [...items]
  next[index] = { ...next[index], ...item }
  return next
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(false)
  const pendingRef = useRef(new Set<string>())
  const itemsRef = useRef(items)
  itemsRef.current = items

  const refreshCart = useCallback(async () => {
    if (!isSupabaseConfigured() || !user) {
      setItems([])
      return
    }
    const cart = await getMyCart()
    setItems(cart.items)
  }, [user])

  useEffect(() => {
    if (authLoading) return

    if (!isSupabaseConfigured() || !user) {
      setItems([])
      setPendingIds(new Set())
      pendingRef.current = new Set()
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void getMyCart()
      .then((cart) => {
        if (!cancelled) setItems(cart.items)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

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
      if (!isSupabaseConfigured() || !user) {
        throw new Error("You must be logged in.")
      }
      const existing = itemsRef.current.find((row) => row.listingId === listingId)
      if (!beginPending(listingId)) {
        if (existing) return existing
        throw new Error("Unable to add to cart.")
      }
      try {
        const item = await addToCartRemote(listingId)
        setItems((current) => upsertItem(current, item))
        try {
          await refreshCart()
        } catch {
          /* keep the RPC row */
        }
        return itemsRef.current.find((row) => row.listingId === listingId) ?? item
      } finally {
        endPending(listingId)
      }
    },
    [refreshCart, user],
  )

  const removeListingFromCart = useCallback(
    async (listingId: string) => {
      if (!isSupabaseConfigured() || !user) return
      if (!beginPending(listingId)) return
      try {
        await removeFromCartRemote(listingId)
        setItems((current) => current.filter((row) => row.listingId !== listingId))
      } finally {
        endPending(listingId)
      }
    },
    [user],
  )

  const setListingQuantity = useCallback(
    async (listingId: string, quantity: number) => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error("You must be logged in.")
      }
      if (!beginPending(listingId)) {
        const existing = itemsRef.current.find((row) => row.listingId === listingId)
        if (existing) return existing
        throw new Error("Unable to update cart.")
      }
      try {
        const item = await updateCartQuantityRemote(listingId, quantity)
        setItems((current) => upsertItem(current, item))
        return item
      } finally {
        endPending(listingId)
      }
    },
    [user],
  )

  const emptyCart = useCallback(async () => {
    if (!isSupabaseConfigured() || !user) return
    await clearCartRemote()
    setItems([])
  }, [user])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.length,
      loading,
      isPending: (listingId: string) => pendingIds.has(listingId),
      hasListing: (listingId: string) => items.some((row) => row.listingId === listingId),
      addListingToCart,
      removeListingFromCart,
      setListingQuantity,
      emptyCart,
      refreshCart,
    }),
    [addListingToCart, emptyCart, items, loading, pendingIds, refreshCart, removeListingFromCart, setListingQuantity],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error("useCart must be used within CartProvider")
  return value
}
