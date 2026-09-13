import { Ionicons } from "@expo/vector-icons"
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { isCartLinePurchasable } from "../../../src/lib/platform/commerce"
import { useAuth } from "../../features/auth/AuthContext"
import { useCart } from "../../features/cart/CartContext"
import { setPendingAuthRedirect } from "../../lib/authRedirect"
import type { CartLine } from "../../lib/commerce"
import { userFacingMessage } from "../../lib/errors"
import { formatIDR } from "../../lib/format"
import { fetchListingPreviews } from "../../lib/listingDetail"
import { colors } from "../../lib/theme"
import type { HomeListing } from "../../types/marketplace"

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function CartScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { listingId: listingIdParam } = useLocalSearchParams<{ listingId?: string }>()
  const focusId = firstParam(listingIdParam)
  const appliedFocus = useRef<string | undefined>(undefined)
  const { session, loading: authLoading } = useAuth()
  const {
    items,
    loading,
    clearing,
    isPending,
    refreshCart,
    setListingQuantity,
    removeListingFromCart,
    emptyCart,
  } = useCart()

  const [previews, setPreviews] = useState<Map<string, HomeListing>>(new Map())
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const [catalogError, setCatalogError] = useState(false)

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace("/(tabs)")
  }, [router])

  useEffect(() => {
    if (!authLoading && !session) setPendingAuthRedirect("/cart")
  }, [authLoading, session])

  useFocusEffect(
    useCallback(() => {
      if (!session) return
      void refreshCart().catch((caught) => {
        setError(userFacingMessage(caught, "Tidak dapat memuat keranjang."))
      })
    }, [refreshCart, session]),
  )

  useEffect(() => {
    if (items.length === 0) {
      setPreviews(new Map())
      setCatalogError(false)
      return
    }
    let cancelled = false
    void fetchListingPreviews(items.map((item) => item.listingId))
      .then((map) => {
        if (cancelled) return
        setPreviews(map)
        setCatalogError(false)
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true)
      })
    return () => {
      cancelled = true
    }
  }, [items])

  const purchasableIds = useMemo(
    () => items.filter((item) => isCartLinePurchasable(item)).map((item) => item.listingId),
    [items],
  )
  const purchasableKey = purchasableIds.join(",")

  useEffect(() => {
    const ids = purchasableKey ? purchasableKey.split(",") : []
    setSelected((current) => {
      if (focusId && ids.includes(focusId) && appliedFocus.current !== focusId) {
        appliedFocus.current = focusId
        return new Set([focusId])
      }
      const next = new Set([...current].filter((id) => ids.includes(id)))
      if (next.size === 0 && ids.length === 1) next.add(ids[0])
      return next
    })
  }, [focusId, purchasableKey])

  const groups = useMemo(() => {
    const order: string[] = []
    const bySeller = new Map<string, { sellerId: string; sellerName: string; rows: CartLine[] }>()
    for (const item of items) {
      const listing = previews.get(item.listingId)
      const sellerId = listing?.sellerId || "unknown"
      const sellerName = listing?.sellerName || "Motodo Seller"
      const group = bySeller.get(sellerId)
      if (group) group.rows.push(item)
      else {
        bySeller.set(sellerId, { sellerId, sellerName, rows: [item] })
        order.push(sellerId)
      }
    }
    return order.map((id) => bySeller.get(id)!).filter(Boolean)
  }, [items, previews])

  const selectedPurchasable = items.filter((item) => selected.has(item.listingId) && isCartLinePurchasable(item))
  const subtotal = selectedPurchasable.reduce((sum, item) => {
    const listing = previews.get(item.listingId)
    if (!listing) return sum
    return sum + listing.price * item.quantity
  }, 0)
  const checkoutReady = selectedPurchasable.length === 1
  const mutating = clearing || items.some((item) => isPending(item.listingId))
  const ctaHeight = 76 + insets.bottom

  function toggleSelected(listingId: string, purchasable: boolean) {
    if (!purchasable) return
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(listingId)) next.delete(listingId)
      else next.add(listingId)
      return next
    })
  }

  function selectAll(on: boolean) {
    setSelected(on ? new Set(purchasableIds) : new Set())
  }

  async function onQuantity(item: CartLine, nextQty: number) {
    const max = item.availableQuantity ?? item.quantity
    if (nextQty < 1 || nextQty > max || isPending(item.listingId)) return
    setError(null)
    try {
      await setListingQuantity(item.listingId, nextQty)
    } catch (caught) {
      setError(userFacingMessage(caught, "Tidak dapat mengubah jumlah."))
    }
  }

  function confirmRemove(listingId: string) {
    Alert.alert("Hapus dari keranjang?", "Motor ini akan dihapus dari keranjang Anda.", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setError(null)
            try {
              await removeListingFromCart(listingId)
            } catch (caught) {
              setError(userFacingMessage(caught, "Tidak dapat menghapus item."))
            }
          })()
        },
      },
    ])
  }

  function confirmClear() {
    if (items.length === 0) return
    Alert.alert("Kosongkan keranjang?", "Semua motor di keranjang akan dihapus.", [
      { text: "Batal", style: "cancel" },
      {
        text: "Kosongkan",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setError(null)
            try {
              await emptyCart()
              setSelected(new Set())
            } catch (caught) {
              setError(userFacingMessage(caught, "Tidak dapat mengosongkan keranjang."))
            }
          })()
        },
      },
    ])
  }

  function onCheckout() {
    if (mutating || selectedPurchasable.length !== 1) return
    router.push({ pathname: "/checkout/[listingId]", params: { listingId: selectedPurchasable[0].listingId } })
  }

  if (authLoading) {
    return (
      <View style={styles.screen}>
        <CartHeader onBack={goBack} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </View>
    )
  }

  if (!session) {
    return <Redirect href={{ pathname: "/(auth)/login", params: { next: "/cart" } }} />
  }

  return (
    <View style={styles.screen}>
      <CartHeader onBack={goBack} onClear={items.length > 0 ? confirmClear : undefined} />
      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons color={colors.brand} name="bag-handle-outline" size={32} />
          </View>
          <Text style={styles.emptyTitle}>Keranjang masih kosong</Text>
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.browseBtn}>
            <Text style={styles.browseText}>Mulai Belanja</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: ctaHeight + 12 }} showsVerticalScrollIndicator={false}>
            {error ? <Text style={styles.banner}>{error}</Text> : null}
            {catalogError ? <Text style={styles.banner}>Detail listing tidak lengkap. Isi keranjang tetap dari server.</Text> : null}

            <View style={styles.selectBar}>
              <Pressable onPress={() => selectAll(selected.size < purchasableIds.length)} style={styles.selectAll}>
                <Ionicons
                  color={colors.brand}
                  name={purchasableIds.length > 0 && selected.size === purchasableIds.length ? "checkbox" : "square-outline"}
                  size={20}
                />
                <Text style={styles.selectAllText}>
                  {selected.size === purchasableIds.length && purchasableIds.length > 0 ? "Batalkan" : "Pilih semua"}
                </Text>
              </Pressable>
              <Text style={styles.selectMeta}>{selectedPurchasable.length} dipilih</Text>
            </View>

            {groups.map((group) => (
              <View key={group.sellerId} style={styles.group}>
                <Pressable
                  disabled={group.sellerId === "unknown"}
                  onPress={() => router.push({ pathname: "/sellers/[sellerId]", params: { sellerId: group.sellerId } })}
                  style={styles.groupHead}
                >
                  <Ionicons color={colors.navyMuted} name="storefront-outline" size={14} />
                  <Text numberOfLines={1} style={styles.groupName}>
                    {group.sellerName}
                  </Text>
                </Pressable>
                {group.rows.map((item) => {
                  const listing = previews.get(item.listingId)
                  const purchasable = isCartLinePurchasable(item)
                  const pending = isPending(item.listingId)
                  const max = item.availableQuantity ?? item.quantity
                  return (
                    <View key={item.listingId} style={[styles.card, !purchasable && styles.cardMuted]}>
                      <Pressable
                        disabled={!purchasable}
                        hitSlop={4}
                        onPress={() => toggleSelected(item.listingId, purchasable)}
                        style={styles.check}
                      >
                        <Ionicons
                          color={purchasable ? colors.brand : colors.navyMuted}
                          name={selected.has(item.listingId) ? "checkbox" : "square-outline"}
                          size={20}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => router.push({ pathname: "/motorcycles/[id]", params: { id: item.listingId } })}
                        style={styles.thumbWrap}
                      >
                        {listing?.image ? (
                          <Image resizeMode="cover" source={{ uri: listing.image }} style={styles.thumb} />
                        ) : (
                          <View style={styles.thumbFallback} />
                        )}
                      </Pressable>
                      <View style={styles.info}>
                        <Pressable onPress={() => router.push({ pathname: "/motorcycles/[id]", params: { id: item.listingId } })}>
                          {listing?.brand ? (
                            <Text numberOfLines={1} style={styles.brand}>
                              {listing.brand}
                            </Text>
                          ) : null}
                          <Text numberOfLines={2} style={styles.name}>
                            {listing?.name ?? "Listing"}
                          </Text>
                          {listing?.city || listing?.location ? (
                            <Text numberOfLines={1} style={styles.meta}>
                              {[listing.location, listing.city].filter(Boolean).join(" · ")}
                            </Text>
                          ) : null}
                          {listing ? (
                            <Text numberOfLines={1} style={styles.price}>
                              {formatIDR(listing.price)}
                            </Text>
                          ) : null}
                          {!purchasable ? <Text style={styles.unavailable}>Tidak tersedia</Text> : null}
                        </Pressable>
                        <View style={styles.itemFooter}>
                          <Pressable accessibilityLabel="Hapus" hitSlop={8} onPress={() => confirmRemove(item.listingId)}>
                            <Ionicons color={colors.navyMuted} name="trash-outline" size={16} />
                          </Pressable>
                          <View style={styles.stepper}>
                            <Pressable
                              disabled={!purchasable || pending || item.quantity <= 1}
                              onPress={() => void onQuantity(item, item.quantity - 1)}
                              style={[styles.stepBtn, (item.quantity <= 1 || !purchasable || pending) && styles.stepDisabled]}
                            >
                              <Ionicons color={colors.navy} name="remove" size={14} />
                            </Pressable>
                            <Text style={styles.qty}>{pending ? "…" : String(item.quantity)}</Text>
                            <Pressable
                              disabled={!purchasable || pending || item.quantity >= max}
                              onPress={() => void onQuantity(item, item.quantity + 1)}
                              style={[styles.stepBtn, (item.quantity >= max || !purchasable || pending) && styles.stepDisabled]}
                            >
                              <Ionicons color={colors.navy} name="add" size={14} />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {selectedPurchasable.length > 1 ? (
              <Text style={styles.hint}>Pilih satu motor untuk checkout.</Text>
            ) : null}
            <View style={styles.ctaRow}>
              <View style={styles.flex}>
                <Text style={styles.ctaLabel}>Subtotal</Text>
                <Text numberOfLines={1} style={styles.ctaPrice}>
                  {formatIDR(subtotal)}
                </Text>
              </View>
              <Pressable
                disabled={!checkoutReady || mutating}
                onPress={onCheckout}
                style={[styles.checkoutBtn, (!checkoutReady || mutating) && styles.checkoutDisabled]}
              >
                <Text style={styles.checkoutText}>{mutating ? "…" : "Checkout"}</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  )
}

function CartHeader({ onBack, onClear }: { onBack: () => void; onClear?: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Back" onPress={onBack} style={styles.headerBtn}>
          <Ionicons color={colors.navy} name="chevron-back" size={26} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          Keranjang
        </Text>
        {onClear ? (
          <Pressable accessibilityLabel="Kosongkan keranjang" onPress={onClear} style={styles.headerBtn}>
            <Ionicons color={colors.navyMuted} name="trash-outline" size={18} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.page,
    flex: 1,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: 4,
  },
  headerBtn: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerTitle: {
    color: colors.navy,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.brandSoft,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    width: 48,
  },
  emptyTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  browseBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  browseText: {
    color: colors.white,
    fontWeight: "700",
  },
  banner: {
    color: colors.danger,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  selectBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  selectAll: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  selectAllText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "600",
  },
  selectMeta: {
    color: colors.navyMuted,
    fontSize: 12,
  },
  group: {
    marginTop: 10,
    paddingHorizontal: 12,
  },
  groupHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  groupName: {
    color: colors.navyMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    flexDirection: "row",
    marginBottom: 8,
    padding: 10,
  },
  cardMuted: {
    opacity: 0.7,
  },
  check: {
    justifyContent: "flex-start",
    paddingRight: 8,
    paddingTop: 2,
  },
  thumbWrap: {
    marginRight: 10,
  },
  thumb: {
    backgroundColor: colors.brandSoft,
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  thumbFallback: {
    backgroundColor: colors.brandSoft,
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    color: colors.navyMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  name: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 1,
  },
  meta: {
    color: colors.navyMuted,
    fontSize: 11,
    marginTop: 3,
  },
  price: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  unavailable: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  itemFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  stepBtn: {
    alignItems: "center",
    backgroundColor: colors.page,
    borderRadius: 7,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  stepDisabled: {
    opacity: 0.35,
  },
  qty: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 16,
    textAlign: "center",
  },
  cta: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    position: "absolute",
    right: 0,
  },
  hint: {
    color: colors.navyMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  ctaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  ctaLabel: {
    color: colors.navyMuted,
    fontSize: 11,
  },
  ctaPrice: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  checkoutBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
    minWidth: 120,
    paddingHorizontal: 18,
  },
  checkoutDisabled: {
    opacity: 0.4,
  },
  checkoutText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
})
