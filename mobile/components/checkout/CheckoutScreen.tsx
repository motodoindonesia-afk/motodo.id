import { Ionicons } from "@expo/vector-icons"
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { isCartLinePurchasable, isListingEligibleForCart } from "../../../src/lib/platform/commerce"
import { isListingEligibleForSale } from "../../../src/lib/platform/demoInventory"
import { motodoErrorCode } from "../../../src/lib/platform/errors"
import { useAuth } from "../../features/auth/AuthContext"
import { useCart } from "../../features/cart/CartContext"
import { setPendingAuthRedirect } from "../../lib/authRedirect"
import { userFacingMessage } from "../../lib/errors"
import { formatIDR } from "../../lib/format"
import { fetchListingDetail, type ListingDetail } from "../../lib/listingDetail"
import { createOrderRemote, publicOrderRef } from "../../lib/orders"
import { colors } from "../../lib/theme"

const NOTES_MAX = 280

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function checkoutErrorMessage(error: unknown) {
  const code = motodoErrorCode(error)
  if (code === "UNAUTHORIZED") return "Masuk untuk membuat pesanan."
  if (code === "LISTING_NOT_FOUND" || code === "LISTING_UNAVAILABLE" || code === "DEMO_LISTING_NOT_FOR_SALE") {
    return "Motor ini tidak lagi dapat dibeli."
  }
  if (code === "INSUFFICIENT_STOCK") return "Stok tidak mencukupi."
  if (code === "SELF_PURCHASE") return "Anda tidak dapat membeli listing sendiri."
  if (code === "INVALID_QUANTITY") return "Jumlah pesanan tidak valid."
  if (code === "INVALID_DELIVERY_METHOD" || code === "DELIVERY_NOT_AVAILABLE") {
    return "Metode pengiriman ini belum tersedia."
  }
  if (code === "INVALID_PAYMENT_METHOD") return "Metode pembayaran tidak valid."
  return userFacingMessage(error, "Tidak dapat membuat pesanan.")
}

function listingPurchasable(listing: ListingDetail, userId?: string) {
  if (!isListingEligibleForSale(listing)) return false
  if (!isListingEligibleForCart(listing, userId)) return false
  return listing.available > 0
}

export function CheckoutScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { listingId: listingIdParam } = useLocalSearchParams<{ listingId?: string }>()
  const listingId = firstParam(listingIdParam) ?? ""
  const { session, loading: authLoading } = useAuth()
  const { items, refreshCart } = useCart()
  const placingRef = useRef(false)

  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [cartReady, setCartReady] = useState(false)
  const [notes, setNotes] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const checkoutPath = listingId ? `/checkout/${listingId}` : "/cart"
  const cartLine = items.find((item) => item.listingId === listingId)
  const quantity = cartLine?.quantity ?? 1

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace("/cart")
  }, [router])

  const load = useCallback(async () => {
    if (!listingId) {
      setListing(null)
      setLoadError("Listing tidak ditemukan.")
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await fetchListingDetail(listingId)
      if (result.kind === "not_found") {
        setListing(null)
        setLoadError("Listing tidak ditemukan.")
        return
      }
      setListing(result.listing)
      setLoadError(null)
    } catch (caught) {
      setLoadError(userFacingMessage(caught, "Tidak dapat memuat checkout."))
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        setPendingAuthRedirect(checkoutPath)
        return
      }
      let cancelled = false
      setCartReady(false)
      void (async () => {
        try {
          await refreshCart()
        } catch {
          /* listing fetch still authoritative for availability */
        }
        if (!cancelled) setCartReady(true)
        if (!cancelled) await load()
      })()
      return () => {
        cancelled = true
      }
    }, [checkoutPath, load, refreshCart, session]),
  )

  const blockedReason = useMemo(() => {
    if (!listing || !session || !cartReady) return null
    if (!cartLine) return "Item tidak ada di keranjang."
    if (listing.sellerId === session.user.id) return "Anda tidak dapat membeli listing sendiri."
    if (!listingPurchasable(listing, session.user.id)) return "Motor ini tidak lagi dapat dibeli."
    if (!isCartLinePurchasable(cartLine)) return "Motor ini tidak lagi dapat dibeli."
    if (quantity > listing.available) return "Stok tidak mencukupi."
    return null
  }, [cartLine, cartReady, listing, quantity, session])

  const total = listing ? listing.price * quantity : 0
  const canSubmit = Boolean(listing && session && cartReady && cartLine && !blockedReason && !submitting)
  const ctaHeight = 84 + insets.bottom

  async function onPlaceOrder() {
    if (!listing || !session || placingRef.current || !canSubmit) return
    if (!cartLine) {
      setSubmitError("Item tidak ada di keranjang.")
      return
    }
    if (blockedReason) {
      setSubmitError(blockedReason)
      return
    }
    placingRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      const fresh = await fetchListingDetail(listing.id)
      if (fresh.kind !== "ok" || !listingPurchasable(fresh.listing, session.user.id)) {
        setSubmitError("Motor ini tidak lagi dapat dibeli.")
        placingRef.current = false
        setSubmitting(false)
        return
      }
      if (quantity > fresh.listing.available) {
        setSubmitError("Stok tidak mencukupi.")
        placingRef.current = false
        setSubmitting(false)
        return
      }

      const order = await createOrderRemote({
        listingId: listing.id,
        quantity,
        deliveryMethod: "pickup",
        paymentMethod: "bank_transfer",
        deliveryNotes: notes.trim() || undefined,
      })
      try {
        await refreshCart()
      } catch {
        /* order succeeded; cart will refresh on next visit */
      }
      router.replace({
        pathname: "/order-confirmation/[orderRef]",
        params: {
          orderRef: publicOrderRef(order),
          placed: "1",
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: String(order.buyerTotal),
        },
      })
    } catch (caught) {
      placingRef.current = false
      setSubmitting(false)
      setSubmitError(checkoutErrorMessage(caught))
    }
  }

  if (authLoading) {
    return (
      <View style={styles.screen}>
        <CheckoutHeader onBack={goBack} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </View>
    )
  }

  if (!session) {
    return <Redirect href={{ pathname: "/(auth)/login", params: { next: checkoutPath } }} />
  }

  const unavailable = !loading && (Boolean(blockedReason) || !listing)

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <CheckoutHeader onBack={goBack} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : unavailable ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{blockedReason || loadError || "Motor ini tidak lagi dapat dibeli."}</Text>
          <Pressable onPress={() => router.replace("/cart")} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Kembali ke Keranjang</Text>
          </Pressable>
        </View>
      ) : listing ? (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: ctaHeight + 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {submitError ? <Text style={styles.banner}>{submitError}</Text> : null}

            <Section title="Pengiriman">
              <OptionRow selected title="Ambil di seller" subtitle="Pickup di garage / showroom" />
              <OptionRow disabled title="Armada seller" subtitle="Coming Soon" />
              <OptionRow disabled title="Kurir pihak ketiga" subtitle="Coming Soon" />
            </Section>

            <Section title="Motor">
              <Pressable
                onPress={() => router.push({ pathname: "/motorcycles/[id]", params: { id: listing.id } })}
                style={styles.product}
              >
                {listing.images[0] ? (
                  <Image resizeMode="cover" source={{ uri: listing.images[0] }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbFallback} />
                )}
                <View style={styles.productInfo}>
                  {listing.brand ? (
                    <Text numberOfLines={1} style={styles.brand}>
                      {listing.brand}
                    </Text>
                  ) : null}
                  <Text style={styles.name}>{listing.name}</Text>
                  <Text numberOfLines={2} style={styles.meta}>
                    {listing.seller.name}
                    {listing.seller.city || listing.city || listing.location
                      ? ` · ${listing.seller.city || listing.city || listing.location}`
                      : ""}
                  </Text>
                  <Text style={styles.price}>
                    {formatIDR(listing.price)}
                    {quantity > 1 ? ` × ${quantity}` : ""}
                  </Text>
                </View>
              </Pressable>
            </Section>

            <Section title="Jaminan & Proteksi">
              <ProtectRow icon="lock-closed-outline" text="Checkout aman melalui Motodo." />
              <ProtectRow icon="shield-checkmark-outline" text="Informasi seller ditampilkan pada listing." />
              <ProtectRow icon="headset-outline" text="Dukungan Motodo saat Anda membutuhkannya." />
            </Section>

            <Section title="Cicilan">
              <Text style={styles.soon}>Coming Soon</Text>
              <Text style={styles.hint}>Simulasi cicilan akan tersedia di versi berikutnya.</Text>
            </Section>

            <Section title="Pembayaran">
              <OptionRow selected title="Mock Payment" subtitle="Bank transfer · belum terhubung ke payment gateway" />
              <OptionRow disabled title="Virtual Account" subtitle="Coming Soon" />
              <OptionRow disabled title="E-Wallet" subtitle="Coming Soon" />
            </Section>

            <Section title="Catatan untuk penjual">
              <TextInput
                maxLength={NOTES_MAX}
                multiline
                onChangeText={setNotes}
                placeholder="Catatan untuk penjual (opsional)"
                placeholderTextColor={colors.navyMuted}
                style={styles.notes}
                value={notes}
              />
              <Text style={styles.hint}>{notes.length}/{NOTES_MAX}</Text>
            </Section>

            <Section title="Ringkasan">
              <SummaryRow label="Harga motor" value={formatIDR(listing.price * quantity)} />
              <SummaryRow label="Pengiriman" value="Coming Soon" muted />
              <SummaryRow label="Proteksi" value="Termasuk checkout Motodo" muted />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatIDR(total)}</Text>
              </View>
            </Section>
          </ScrollView>

          <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <View style={styles.ctaSum}>
              <Text style={styles.ctaLabel}>Total</Text>
              <Text numberOfLines={1} style={styles.ctaPrice}>
                {formatIDR(total)}
              </Text>
            </View>
            <Pressable
              disabled={!canSubmit}
              onPress={() => void onPlaceOrder()}
              style={[styles.placeBtn, !canSubmit && styles.placeDisabled]}
            >
              {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.placeText}>Buat Pesanan</Text>}
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{loadError || "Tidak dapat memuat checkout."}</Text>
          <Pressable onPress={() => router.replace("/cart")} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Kembali ke Keranjang</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

function CheckoutHeader({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Back" onPress={onBack} style={styles.headerBtn}>
          <Ionicons color={colors.navy} name="chevron-back" size={26} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          Checkout
        </Text>
        <View style={styles.headerBtn} />
      </View>
    </View>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function OptionRow({
  title,
  subtitle,
  selected,
  disabled,
}: {
  title: string
  subtitle: string
  selected?: boolean
  disabled?: boolean
}) {
  return (
    <View style={[styles.option, disabled && styles.optionDisabled]}>
      <Ionicons
        color={disabled ? colors.navyMuted : selected ? colors.brand : colors.navyMuted}
        name={selected && !disabled ? "radio-button-on" : "radio-button-off"}
        size={18}
      />
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, disabled && styles.muted]}>{title}</Text>
        <Text style={styles.optionSub}>{subtitle}</Text>
      </View>
    </View>
  )
}

function ProtectRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.protect}>
      <Ionicons color={colors.brand} name={icon} size={16} />
      <Text style={styles.protectText}>{text}</Text>
    </View>
  )
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, muted && styles.muted]}>{value}</Text>
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
  emptyTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  banner: {
    backgroundColor: "#fef2f2",
    color: colors.danger,
    fontSize: 13,
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  section: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 12,
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  option: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
  },
  optionDisabled: {
    opacity: 0.7,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "600",
  },
  optionSub: {
    color: colors.navyMuted,
    fontSize: 12,
    marginTop: 1,
  },
  product: {
    flexDirection: "row",
    gap: 10,
  },
  thumb: {
    backgroundColor: colors.page,
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  thumbFallback: {
    backgroundColor: colors.page,
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    color: colors.navyMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  name: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    color: colors.navyMuted,
    fontSize: 12,
    marginTop: 2,
  },
  price: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  protect: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  protectText: {
    color: colors.navy,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  soon: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "600",
  },
  hint: {
    color: colors.navyMuted,
    fontSize: 12,
    marginTop: 4,
  },
  notes: {
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.navy,
    fontSize: 14,
    minHeight: 72,
    padding: 10,
    textAlignVertical: "top",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  summaryLabel: {
    color: colors.navyMuted,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.navy,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  muted: {
    color: colors.navyMuted,
    fontWeight: "500",
  },
  totalRow: {
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "700",
  },
  totalValue: {
    color: colors.navy,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  cta: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  ctaSum: {
    flex: 1,
    minWidth: 0,
  },
  ctaLabel: {
    color: colors.navyMuted,
    fontSize: 11,
  },
  ctaPrice: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: "800",
  },
  placeBtn: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 148,
    paddingHorizontal: 16,
  },
  placeDisabled: {
    opacity: 0.45,
  },
  placeText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
})
