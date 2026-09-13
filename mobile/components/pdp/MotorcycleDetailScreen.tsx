import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { isListingEligibleForCart, isListingEligibleForFavorite } from "../../../src/lib/platform/commerce"
import { isListingEligibleForSale } from "../../../src/lib/platform/demoInventory"
import { motodoErrorCode } from "../../../src/lib/platform/errors"
import { useAuth } from "../../features/auth/AuthContext"
import { useCart } from "../../features/cart/CartContext"
import { useFavorites } from "../../features/favorites/FavoritesContext"
import { startConversationRemote } from "../../lib/commerce"
import { isMobileSupabaseConfigured } from "../../lib/env"
import { setPendingAuthRedirect } from "../../lib/authRedirect"
import { userFacingMessage } from "../../lib/errors"
import { formatIDR, formatMileageKm, initials } from "../../lib/format"
import { setExpoToolsButtonVisible } from "../../lib/expoToolsButton"
import { fetchListingDetail, type ListingDetail } from "../../lib/listingDetail"
import { colors } from "../../lib/theme"
import type { HomeListing } from "../../types/marketplace"
import { ProductCard } from "../home/ProductCard"
import { ImageGallery } from "./ImageGallery"
import { PdpHeader } from "./PdpHeader"

function hasSpecValue(value: string | number | null | undefined) {
  if (value === undefined || value === null || value === "") return false
  if (value === "—" || value === "-") return false
  if (typeof value === "number" && (!Number.isFinite(value) || value <= 0)) return false
  return true
}

function cartErrorMessage(error: unknown) {
  const code = motodoErrorCode(error)
  if (code === "DEMO_LISTING_NOT_FOR_SALE") return "Listing demo tidak dapat dibeli."
  if (code === "SELF_PURCHASE") return "Anda tidak dapat membeli listing sendiri."
  if (code === "LISTING_UNAVAILABLE" || code === "LISTING_NOT_FOUND") return "Listing ini tidak tersedia."
  if (code === "INSUFFICIENT_STOCK") return "Stok listing ini tidak mencukupi."
  if (code === "UNAUTHORIZED") return "Masuk untuk menambahkan ke keranjang."
  return userFacingMessage(error, "Tidak dapat menambahkan ke keranjang.")
}

export function MotorcycleDetailScreen() {
  const { id, buyNow } = useLocalSearchParams<{ id?: string; buyNow?: string }>()
  const listingId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : ""
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace("/(tabs)")
  }, [router])

  useFocusEffect(
    useCallback(() => {
      setExpoToolsButtonVisible(false)
      return () => setExpoToolsButtonVisible(true)
    }, []),
  )

  const { session } = useAuth()
  const { isFavorited, toggleListingFavorite } = useFavorites()
  const { addListingToCart, hasListing, isPending, quantityFor } = useCart()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<"ok" | "not_found" | "inactive" | null>(null)
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [related, setRelated] = useState<HomeListing[]>([])
  const [descOpen, setDescOpen] = useState(false)
  const [simOpen, setSimOpen] = useState(false)
  const [protectOpen, setProtectOpen] = useState(false)
  const [actionNote, setActionNote] = useState("")
  const [actionError, setActionError] = useState("")
  const [buying, setBuying] = useState(false)
  const buyNowStarted = useRef(false)
  const buyInFlight = useRef(false)

  const load = useCallback(async () => {
    if (!listingId) {
      setKind("not_found")
      setListing(null)
      setLoading(false)
      return
    }
    if (!isMobileSupabaseConfigured()) {
      setError("Supabase belum dikonfigurasi.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchListingDetail(listingId)
      setKind(result.kind === "not_found" ? "not_found" : result.kind)
      if (result.kind === "not_found") {
        setListing(null)
        setRelated([])
      } else {
        setListing(result.listing)
        setRelated(result.related)
      }
    } catch (caught) {
      setError(userFacingMessage(caught, "Tidak dapat memuat listing. Periksa koneksi Anda."))
      setListing(null)
      setKind(null)
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    buyNowStarted.current = false
    buyInFlight.current = false
    setDescOpen(false)
    setSimOpen(false)
    setProtectOpen(false)
    setActionNote("")
    setActionError("")
    void load()
  }, [load])

  function goLogin(extra?: { buyNow?: boolean }) {
    const next = `/motorcycles/${listingId}`
    setPendingAuthRedirect(next, extra?.buyNow ? "1" : undefined)
    router.push({
      pathname: "/(auth)/login",
      params: {
        next,
        ...(extra?.buyNow ? { buyNow: "1" } : {}),
      },
    })
  }

  const addToCartThenGoToCart = useCallback(
    async (target: ListingDetail) => {
      if (buyInFlight.current) return
      setActionError("")
      if (!isListingEligibleForCart(target, session?.user.id)) {
        setActionError("Listing ini tidak dapat dibeli.")
        return
      }
      buyInFlight.current = true
      setBuying(true)
      try {
        if (!hasListing(target.id)) {
          await addListingToCart(target.id)
        }
        router.push("/cart")
      } catch (caught) {
        setActionError(cartErrorMessage(caught))
      } finally {
        buyInFlight.current = false
        setBuying(false)
      }
    },
    [addListingToCart, hasListing, router, session?.user.id],
  )

  useEffect(() => {
    const flag = Array.isArray(buyNow) ? buyNow[0] : buyNow
    if (flag !== "1" || !session || !listing || kind !== "ok") return
    if (buyNowStarted.current) return
    const own = listing.sellerId === session.user.id
    if (
      own ||
      listing.status !== "active" ||
      listing.available <= 0 ||
      !isListingEligibleForSale(listing) ||
      !isListingEligibleForCart(listing, session.user.id)
    ) {
      buyNowStarted.current = true
      return
    }
    buyNowStarted.current = true
    void addToCartThenGoToCart(listing)
  }, [addToCartThenGoToCart, buyNow, kind, listing, session])

  async function onFavorite() {
    if (!listing) return
    if (!session) {
      goLogin()
      return
    }
    if (!isListingEligibleForFavorite({ status: listing.status, sellerId: listing.sellerId }, session.user.id)) return
    setActionError("")
    try {
      await toggleListingFavorite(listing.id)
    } catch (caught) {
      setActionError(userFacingMessage(caught, "Tidak dapat memperbarui favorit."))
    }
  }

  async function onAddToCart() {
    if (!listing) return
    if (!session) {
      goLogin()
      return
    }
    if (buyDisabled) return
    setActionError("")
    setActionNote("")
    try {
      const before = quantityFor(listing.id)
      const line = await addListingToCart(listing.id)
      if (before > 0 && line.quantity === before) {
        setActionNote("Motor ini sudah ada di keranjang.")
      } else {
        setActionNote("Ditambahkan ke keranjang.")
      }
    } catch (caught) {
      setActionError(cartErrorMessage(caught))
    }
  }

  async function onBuyNow() {
    if (!listing || buying || isPending(listing.id)) return
    if (!session) {
      goLogin({ buyNow: true })
      return
    }
    if (listing.sellerId === session.user.id) {
      setActionError("Anda tidak dapat membeli listing sendiri.")
      return
    }
    if (buyDisabled) return
    await addToCartThenGoToCart(listing)
  }

  async function onChat() {
    if (!listing) return
    if (!session) {
      goLogin()
      return
    }
    setActionError("")
    try {
      const conversationId = await startConversationRemote(listing.id)
      router.push({ pathname: "/messages/[id]", params: { id: conversationId } })
    } catch (caught) {
      const code = motodoErrorCode(caught)
      if (code === "SELF_CONVERSATION") setActionError("Anda tidak dapat chat listing sendiri.")
      else setActionError(userFacingMessage(caught, "Tidak dapat memulai percakapan."))
    }
  }

  const soldOut = Boolean(listing && (listing.status === "sold" || listing.available <= 0))
  const isOwnListing = Boolean(session && listing && listing.sellerId === session.user.id)
  const saleEligible = listing ? isListingEligibleForSale(listing) : false
  const buyDisabled = !listing || soldOut || listing.status !== "active" || isOwnListing || !saleEligible || listing.available <= 0
  const favorited = listing ? isFavorited(listing.id) : false
  const monthlySim = listing && listing.price > 0 ? formatIDR(Math.round(listing.price / 24)) : ""
  const shipFrom = listing && hasSpecValue(listing.location) ? listing.location : listing?.seller.city || listing?.city || ""
  const longDescription = (listing?.description.length ?? 0) > 220
  const ctaHeight = 64 + insets.bottom

  const specRows = useMemo(() => {
    if (!listing) return []
    const rows: Array<{ label: string; value: string }> = []
    if (listing.condition) rows.push({ label: "Kondisi", value: listing.condition })
    if (listing.year) rows.push({ label: "Tahun", value: String(listing.year) })
    if (listing.mileage != null && listing.mileage >= 0) rows.push({ label: "Kilometer", value: formatMileageKm(listing.mileage) })
    if (listing.engine) rows.push({ label: "Mesin", value: listing.engine })
    if (listing.transmission) rows.push({ label: "Transmisi", value: listing.transmission })
    if (listing.fuel) rows.push({ label: "Bahan bakar", value: listing.fuel })
    if (listing.color) rows.push({ label: "Warna", value: listing.color })
    return rows
  }, [listing])

  if (loading) {
    return (
      <View style={styles.screen}>
        <PdpHeader onBack={goBack} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.muted}>Memuat motor...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <PdpHeader onBack={goBack} />
        <View style={styles.centered}>
          <Text style={styles.title}>Tidak dapat memuat</Text>
          <Text style={styles.body}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  if (kind === "not_found" || !listing) {
    return (
      <View style={styles.screen}>
        <PdpHeader onBack={goBack} />
        <View style={styles.centered}>
          <Text style={styles.title}>Listing tidak ditemukan</Text>
          <Text style={styles.body}>Motor ini tidak tersedia atau tautannya tidak valid.</Text>
          <Pressable onPress={goBack} style={styles.retry}>
            <Text style={styles.retryText}>Kembali</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  if (kind === "inactive") {
    return (
      <View style={styles.screen}>
        <PdpHeader onBack={goBack} />
        <View style={styles.centered}>
          <Text style={styles.title}>Listing tidak aktif</Text>
          <Text style={styles.body}>{listing.name} sedang tidak ditampilkan di marketplace.</Text>
          <Pressable onPress={goBack} style={styles.retry}>
            <Text style={styles.retryText}>Kembali</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <PdpHeader onBack={goBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: ctaHeight + 16 }} showsVerticalScrollIndicator={false}>
        <ImageGallery alt={listing.name} images={listing.images} />

        <View style={styles.section}>
          {listing.brand ? <Text style={styles.brand}>{listing.brand}</Text> : null}
          <Text style={styles.name}>{listing.name}</Text>
          {listing.model ? <Text style={styles.model}>{listing.model}</Text> : null}
          {listing.listingRatingCount > 0 && listing.listingRatingAverage != null ? (
            <Text style={styles.rating}>
              {listing.listingRatingAverage.toFixed(1)} · {listing.listingRatingCount} ulasan
            </Text>
          ) : null}
          <Text style={styles.price}>{formatIDR(listing.price)}</Text>
          {listing.city || listing.location ? (
            <Text style={styles.meta}>{[listing.location, listing.city].filter(Boolean).join(" · ")}</Text>
          ) : null}
          {soldOut || listing.status !== "active" ? (
            <Text style={styles.unavailable}>Tidak tersedia untuk dibeli</Text>
          ) : listing.isDemo ? (
            <Text style={styles.unavailable}>Listing demo — tidak dapat dibeli</Text>
          ) : (
            <Text style={styles.meta}>Stok tersedia: {listing.available}</Text>
          )}
          {specRows.length > 0 ? (
            <View style={styles.specBox}>
              {specRows.map((row) => (
                <View key={row.label} style={styles.specRow}>
                  <Text style={styles.specLabel}>{row.label}</Text>
                  <Text style={styles.specValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <SellerCard listing={listing} onChat={() => void onChat()} onShop={() => router.push({ pathname: "/sellers/[sellerId]", params: { sellerId: listing.sellerId } })} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pengiriman</Text>
          <Text style={styles.cardBody}>
            {shipFrom ? `Pengambilan di area ${shipFrom}.` : "Pengambilan dapat diatur dengan seller."}
            {listing.showroomAddress ? `\nShowroom: ${listing.showroomAddress}` : ""}
            {"\n"}Logistik pihak ketiga: Coming Soon.
            {"\n"}Estimasi pengiriman dikonfirmasi setelah pemesanan. Motodo belum memiliki jaringan kurir nasional.
          </Text>
        </View>

        <Pressable onPress={() => setSimOpen((open) => !open)} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Cicilan — Segera Hadir</Text>
              <Text style={styles.cardBody}>Simulasi tampilan saja, bukan persetujuan pembiayaan.</Text>
            </View>
            <Text style={styles.link}>Lihat Simulasi</Text>
          </View>
          {simOpen ? (
            <View style={styles.nested}>
              <Text style={styles.cardTitle}>Simulasi cicilan</Text>
              {monthlySim ? <Text style={styles.cardBody}>Mulai dari {monthlySim}/bulan</Text> : null}
              <Text style={styles.cardBody}>Ilustrasi: harga listing dibagi 24 bulan. Bukan penawaran pembiayaan Motodo.</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable onPress={() => setProtectOpen((open) => !open)} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Jaminan & Proteksi</Text>
              <Text style={styles.cardBody}>Checkout Motodo • Chat seller • Dukungan Motodo</Text>
            </View>
            <Text style={styles.link}>Selengkapnya</Text>
          </View>
          {protectOpen ? (
            <View style={styles.nested}>
              <Text style={styles.cardBody}>
                Ini adalah praktik marketplace Motodo saat ini — bukan asuransi, escrow, atau jaminan refund.
              </Text>
              <Text style={styles.cardBody}>Pembelian melalui checkout Motodo.</Text>
              <Text style={styles.cardBody}>Hubungi seller melalui chat Motodo.</Text>
              <Text style={styles.cardBody}>Dukungan Motodo tersedia untuk pertanyaan akun dan pesanan.</Text>
            </View>
          ) : null}
        </Pressable>

        {listing.description ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Deskripsi</Text>
            <Text numberOfLines={!descOpen && longDescription ? 4 : undefined} style={styles.cardBody}>
              {listing.description}
            </Text>
            {longDescription ? (
              <Pressable onPress={() => setDescOpen((open) => !open)} hitSlop={8}>
                <Text style={styles.link}>{descOpen ? "Lihat lebih sedikit" : "Lihat selengkapnya"}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {related.length > 0 ? (
          <View style={styles.related}>
            <Text style={styles.relatedTitle}>Motor Serupa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>
              {related.map((item) => (
                <ProductCard
                  compact
                  favorited={isFavorited(item.id)}
                  key={item.id}
                  listing={item}
                  onFavorite={() => {
                    if (!session) {
                      setPendingAuthRedirect(`/motorcycles/${item.id}`)
                      router.push({ pathname: "/(auth)/login", params: { next: `/motorcycles/${item.id}` } })
                      return
                    }
                    void toggleListingFavorite(item.id).catch(() => undefined)
                  }}
                  onPress={() => router.push({ pathname: "/motorcycles/[id]", params: { id: item.id } })}
                  width={148}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {actionError ? <Text style={styles.ctaError}>{actionError}</Text> : null}
        {actionNote ? <Text style={styles.ctaNote}>{actionNote}</Text> : null}
        {isOwnListing ? <Text style={styles.ctaNote}>Ini listing Anda.</Text> : null}
        <View style={styles.ctaRow}>
          <Pressable accessibilityLabel="Favorite" onPress={() => void onFavorite()} style={styles.heartBtn}>
            <Ionicons color={favorited ? colors.brand : colors.navy} name={favorited ? "heart" : "heart-outline"} size={22} />
          </Pressable>
          <Pressable disabled={buyDisabled} onPress={() => void onAddToCart()} style={[styles.cartBtn, buyDisabled && styles.disabled]}>
            <Text numberOfLines={2} style={styles.cartText}>
              Tambah ke Keranjang
            </Text>
          </Pressable>
          <Pressable disabled={buyDisabled || buying || isPending(listing.id)} onPress={() => void onBuyNow()} style={[styles.buyBtn, (buyDisabled || buying) && styles.disabled]}>
            <Text numberOfLines={2} style={styles.buyText}>
              {buying ? "Memuat..." : "Beli Sekarang"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

function SellerCard({
  listing,
  onChat,
  onShop,
}: {
  listing: ListingDetail
  onChat: () => void
  onShop: () => void
}) {
  const seller = listing.seller
  const metrics: string[] = []
  if (seller.ratingAverage != null && seller.ratingCount > 0) {
    metrics.push(`${seller.ratingAverage.toFixed(1)} · ${seller.ratingCount} ulasan`)
  }
  if (seller.listingCount != null) metrics.push(`${seller.listingCount} listing aktif`)
  if (seller.joinedYear) metrics.push(`Bergabung ${seller.joinedYear}`)

  return (
    <View style={styles.seller}>
      {seller.coverUrl ? <Image resizeMode="cover" source={{ uri: seller.coverUrl }} style={styles.sellerCover} /> : <View style={styles.sellerCoverFallback} />}
      <View style={styles.sellerScrim} />
      <View style={styles.sellerBody}>
        <View style={styles.sellerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(seller.name)}</Text>
          </View>
          <View style={styles.flex}>
            <View style={styles.sellerNameRow}>
              <Text numberOfLines={1} style={styles.sellerName}>
                {seller.name}
              </Text>
              {seller.verified ? <Ionicons color="#dbeafe" name="checkmark-circle" size={16} /> : null}
            </View>
            {seller.city ? <Text style={styles.sellerCity}>{seller.city}</Text> : null}
          </View>
        </View>
        {metrics.length > 0 ? (
          <View style={styles.metrics}>
            {metrics.map((metric) => (
              <Text key={metric} style={styles.metricText}>
                {metric}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={styles.sellerActions}>
          <Pressable onPress={onChat} style={styles.sellerBtn}>
            <Text style={styles.sellerBtnText}>Chat Seller</Text>
          </Pressable>
          <Pressable onPress={onShop} style={styles.sellerBtnGhost}>
            <Text style={styles.sellerBtnGhostText}>View Shop</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.page,
    flex: 1,
  },
  centered: {
    alignItems: "center",
    backgroundColor: colors.white,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    color: colors.navyMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  muted: {
    color: colors.navyMuted,
    fontSize: 13,
    marginTop: 10,
  },
  retry: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.white,
    fontWeight: "700",
  },
  section: {
    backgroundColor: colors.white,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  brand: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  name: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  model: {
    color: colors.navyMuted,
    fontSize: 14,
  },
  rating: {
    color: colors.navyMuted,
    fontSize: 12,
    marginTop: 2,
  },
  price: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 6,
  },
  meta: {
    color: colors.navyMuted,
    fontSize: 13,
  },
  unavailable: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  specBox: {
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    overflow: "hidden",
  },
  specRow: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  specLabel: {
    color: colors.navyMuted,
    fontSize: 13,
  },
  specValue: {
    color: colors.navy,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 12,
    textAlign: "right",
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "700",
  },
  cardBody: {
    color: colors.navyMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  rowBetween: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  link: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  nested: {
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 10,
  },
  seller: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 10,
    minHeight: 168,
    overflow: "hidden",
  },
  sellerCover: {
    ...StyleSheet.absoluteFill,
  },
  sellerCoverFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.navy,
  },
  sellerScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11,31,58,0.48)",
  },
  sellerBody: {
    padding: 14,
  },
  sellerTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarText: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "800",
  },
  sellerNameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  sellerName: {
    color: colors.white,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  sellerCity: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    marginTop: 2,
  },
  metrics: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metricText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  sellerActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  sellerBtn: {
    backgroundColor: colors.white,
    borderRadius: 10,
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  sellerBtnText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  sellerBtnGhost: {
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 10,
  },
  sellerBtnGhostText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  related: {
    paddingTop: 16,
  },
  relatedTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  relatedRow: {
    gap: 10,
    paddingBottom: 8,
    paddingHorizontal: 16,
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
  ctaRow: {
    flexDirection: "row",
    gap: 8,
  },
  heartBtn: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  cartBtn: {
    alignItems: "center",
    borderColor: colors.brand,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 6,
  },
  cartText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  buyBtn: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 6,
  },
  buyText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.45,
  },
  ctaError: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 6,
  },
  ctaNote: {
    color: colors.navy,
    fontSize: 12,
    marginBottom: 6,
  },
})
