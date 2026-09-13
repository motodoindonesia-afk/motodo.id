import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "../features/auth/AuthContext"
import { useCart } from "../features/cart/CartContext"
import { setPendingAuthRedirect } from "../lib/authRedirect"
import { userFacingMessage } from "../lib/errors"
import { formatIDR } from "../lib/format"
import { fetchListingPreviews } from "../lib/listingDetail"
import { colors } from "../lib/theme"
import type { HomeListing } from "../types/marketplace"

export default function CartScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const { items, loading, refreshCart } = useCart()
  const [previews, setPreviews] = useState<Map<string, HomeListing>>(new Map())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    void refreshCart().catch((caught) => {
      if (!cancelled) setError(userFacingMessage(caught, "Tidak dapat memuat keranjang."))
    })
    return () => {
      cancelled = true
    }
  }, [refreshCart, session])

  useEffect(() => {
    if (items.length === 0) {
      setPreviews(new Map())
      return
    }
    let cancelled = false
    void fetchListingPreviews(items.map((item) => item.listingId))
      .then((map) => {
        if (!cancelled) {
          setPreviews(map)
          setError(null)
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(userFacingMessage(caught, "Tidak dapat memuat keranjang."))
      })
    return () => {
      cancelled = true
    }
  }, [items])

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Masuk untuk melihat keranjang</Text>
        <Pressable
          onPress={() => {
            setPendingAuthRedirect("/cart")
            router.push({ pathname: "/(auth)/login", params: { next: "/cart" } })
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    )
  }

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>Checkout belum dibuka di mobile. Keranjang ini memakai data yang sama dengan web.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.length === 0 ? <Text style={styles.empty}>Keranjang masih kosong.</Text> : null}
      {items.map((item) => {
        const listing = previews.get(item.listingId)
        return (
          <Pressable
            key={item.listingId}
            onPress={() => router.push({ pathname: "/motorcycles/[id]", params: { id: item.listingId } })}
            style={styles.row}
          >
            <View style={styles.flex}>
              <Text style={styles.name}>{listing?.name ?? "Listing"}</Text>
              <Text style={styles.meta}>Qty {item.quantity}{listing ? ` · ${formatIDR(listing.price)}` : ""}</Text>
            </View>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: colors.white,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    backgroundColor: colors.page,
    flexGrow: 1,
    padding: 16,
  },
  title: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  lead: {
    color: colors.navyMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  empty: {
    color: colors.navyMuted,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  flex: {
    minWidth: 0,
  },
  name: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    color: colors.navyMuted,
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
  },
})
