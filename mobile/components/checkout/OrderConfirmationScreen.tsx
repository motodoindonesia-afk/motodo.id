import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { userFacingMessage } from "../../lib/errors"
import { formatIDR } from "../../lib/format"
import { fetchOrderByRef, orderStatusLabel, type MobileOrder } from "../../lib/orders"
import { colors } from "../../lib/theme"

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function OrderConfirmationScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    orderRef?: string
    placed?: string
    status?: string
    paymentStatus?: string
    total?: string
  }>()
  const orderRef = firstParam(params.orderRef) ?? ""
  const placed = firstParam(params.placed) === "1"
  const [order, setOrder] = useState<MobileOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(orderRef))

  useEffect(() => {
    if (!orderRef) {
      setLoading(false)
      setError("Pesanan tidak ditemukan.")
      return
    }
    let cancelled = false
    void fetchOrderByRef(orderRef)
      .then((row) => {
        if (cancelled) return
        setOrder(row)
        if (!row) setError("Pesanan tidak ditemukan.")
      })
      .catch((caught) => {
        if (!cancelled) setError(userFacingMessage(caught, "Tidak dapat memuat pesanan."))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderRef])

  const status = order
    ? orderStatusLabel(order)
    : firstParam(params.paymentStatus) === "pending" || firstParam(params.status) === "pending"
      ? "Menunggu pembayaran"
      : firstParam(params.status) || "Menunggu pembayaran"
  const totalRaw = firstParam(params.total)
  const total = order?.buyerTotal ?? (totalRaw && Number.isFinite(Number(totalRaw)) ? Number(totalRaw) : null)

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.body}>
        <View style={styles.icon}>
          <Ionicons color={colors.brand} name={placed ? "checkmark-circle" : "receipt-outline"} size={40} />
        </View>
        <Text style={styles.title}>{placed ? "Pesanan berhasil dibuat" : "Detail pesanan"}</Text>
        {loading ? <ActivityIndicator color={colors.brand} style={{ marginTop: 16 }} /> : null}
        {orderRef ? (
          <Text style={styles.ref}>
            Order{"\n"}
            <Text style={styles.refValue}>#{order?.orderNumber ?? orderRef}</Text>
          </Text>
        ) : null}
        <Text style={styles.status}>Status: {status}</Text>
        {order?.listingName ? (
          <Text style={styles.meta}>{order.listingName}</Text>
        ) : null}
        {total != null ? <Text style={styles.total}>{formatIDR(total)}</Text> : null}
        {error && !order ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      {placed ? (
        <Pressable onPress={() => router.replace("/(tabs)/orders")} style={styles.primary}>
          <Text style={styles.primaryText}>Lihat Pesanan</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/orders"))}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>Kembali</Text>
        </Pressable>
      )}
      <Pressable onPress={() => router.replace("/(tabs)")} style={styles.secondary}>
        <Text style={styles.secondaryText}>Kembali ke Home</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: 20,
  },
  body: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.brandSoft,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  title: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  ref: {
    color: colors.navyMuted,
    fontSize: 13,
    marginTop: 16,
    textAlign: "center",
  },
  refValue: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: "800",
  },
  status: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  meta: {
    color: colors.navyMuted,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  total: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
  primary: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  secondary: {
    alignItems: "center",
    marginTop: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  secondaryText: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: "700",
  },
})
