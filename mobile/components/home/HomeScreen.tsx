import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { isListingEligibleForFavorite } from "../../../src/lib/platform/commerce"
import { useAuth } from "../../features/auth/AuthContext"
import { useCart } from "../../features/cart/CartContext"
import { useFavorites } from "../../features/favorites/FavoritesContext"
import { getInboxUnreadCount } from "../../lib/commerce"
import { setPendingAuthRedirect } from "../../lib/authRedirect"
import { isMobileSupabaseConfigured } from "../../lib/env"
import { fetchHomeMarketplace } from "../../lib/homeMarketplace"
import { colors } from "../../lib/theme"
import type { HomeGarage, HomeListing } from "../../types/marketplace"
import { GarageRail } from "./GarageRail"
import { HomeHeader } from "./HomeHeader"
import { ProductGrid } from "./ProductGrid"
import { SectionHeader } from "./SectionHeader"
import { ShortcutRail, type HomeShortcut } from "./ShortcutRail"

const SHORTCUTS: HomeShortcut[] = [
  { id: "all", label: "Semua Motor", icon: "grid-outline" },
  { id: "Chopper", label: "Custom", icon: "construct-outline" },
  { id: "Harley-Davidson", label: "Premium", icon: "star-outline" },
  { id: "garages", label: "Garage", icon: "business-outline" },
  { id: "new", label: "Baru", icon: "sparkles-outline" },
  { id: "Bobber", label: "Bobber", icon: "bicycle-outline" },
  { id: "Brat Cafe", label: "Bratstyle", icon: "cafe-outline" },
]

export function HomeScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const { isFavorited, toggleListingFavorite } = useFavorites()
  const { itemCount } = useCart()
  const scrollRef = useRef<ScrollView>(null)
  const garageY = useRef(0)
  const recY = useRef(0)

  const [listings, setListings] = useState<HomeListing[]>([])
  const [garages, setGarages] = useState<HomeGarage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [messageCount, setMessageCount] = useState(0)

  const load = useCallback(async () => {
    if (!isMobileSupabaseConfigured()) {
      setError("Supabase is not configured.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchHomeMarketplace()
      setListings(data.listings)
      setGarages(data.garages)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load marketplace.")
      setListings([])
      setGarages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!session?.user.id) {
      setMessageCount(0)
      return
    }
    let cancelled = false
    void getInboxUnreadCount(session.user.id)
      .then((count) => {
        if (!cancelled) setMessageCount(count)
      })
      .catch(() => {
        if (!cancelled) setMessageCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  const filtered = useMemo(() => {
    if (filter === "all" || filter === "new" || filter === "garages") return listings
    return listings.filter((item) => item.category === filter || item.brand === filter)
  }, [filter, listings])

  function onShortcut(id: string) {
    if (id === "garages") {
      setFilter("all")
      scrollRef.current?.scrollTo({ y: Math.max(0, garageY.current - 8), animated: true })
      return
    }
    setFilter(id)
    if (id !== "all") {
      scrollRef.current?.scrollTo({ y: Math.max(0, recY.current - 8), animated: true })
    }
  }

  async function onFavorite(listing: HomeListing) {
    if (!session) {
      setPendingAuthRedirect(`/motorcycles/${listing.id}`)
      router.push({ pathname: "/(auth)/login", params: { next: `/motorcycles/${listing.id}` } })
      return
    }
    if (!isListingEligibleForFavorite({ status: listing.status, sellerId: listing.sellerId }, session.user.id)) return
    try {
      await toggleListingFavorite(listing.id)
    } catch {
      /* FavoritesContext restores the previous heart state. */
    }
  }

  function openListing(listing: HomeListing) {
    router.push({ pathname: "/motorcycles/[id]", params: { id: listing.id } })
  }

  return (
    <View style={styles.screen}>
      <HomeHeader
        cartCount={itemCount}
        messageCount={messageCount}
        onSearch={() => router.push({ pathname: "/coming-soon", params: { title: "Cari" } })}
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ShortcutRail activeId={filter} items={SHORTCUTS} onPress={onShortcut} />

        {error ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retry}>
              <Text style={styles.retryText}>Coba lagi</Text>
            </Pressable>
          </View>
        ) : null}

        <View
          onLayout={(event) => {
            garageY.current = event.nativeEvent.layout.y
          }}
        >
          <SectionHeader title="Garage Pilihan" />
        </View>
        {!loading && garages.length === 0 && !error ? (
          <Text style={styles.empty}>Belum ada garage untuk ditampilkan.</Text>
        ) : (
          <GarageRail
            garages={garages}
            loading={loading}
            onPress={(garage) => router.push({ pathname: "/sellers/[sellerId]", params: { sellerId: garage.id } })}
          />
        )}

        <View
          onLayout={(event) => {
            recY.current = event.nativeEvent.layout.y
          }}
        >
          <SectionHeader title="Rekomendasi Untuk Kamu" />
        </View>
        {!loading && !error && filtered.length === 0 ? (
          <Text style={styles.empty}>Belum ada motor untuk ditampilkan.</Text>
        ) : (
          <ProductGrid
            favorited={isFavorited}
            listings={filtered}
            loading={loading}
            onFavorite={(listing) => void onFavorite(listing)}
            onPress={openListing}
          />
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.page,
    flex: 1,
  },
  content: {
    paddingBottom: 12,
  },
  empty: {
    color: colors.navyMuted,
    fontSize: 13,
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  banner: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
    marginHorizontal: 12,
    padding: 12,
  },
  bannerText: {
    color: colors.navy,
    fontSize: 13,
    textAlign: "center",
  },
  retry: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
})
