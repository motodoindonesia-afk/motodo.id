import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuth } from "../../features/auth/AuthContext"
import { setPendingAuthRedirect } from "../../lib/authRedirect"
import { userFacingMessage } from "../../lib/errors"
import { formatIDR } from "../../lib/format"
import { fetchMyOrders, orderStatusLabel, publicOrderRef, type MobileOrder } from "../../lib/orders"
import { colors } from "../../lib/theme"

export default function OrdersTab() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<MobileOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchMyOrders()
      setOrders(rows)
      setError(null)
    } catch (caught) {
      setError(userFacingMessage(caught, "Tidak dapat memuat pesanan."))
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        setOrders([])
        return
      }
      void load()
    }, [load, session]),
  )

  if (authLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  if (!session) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>Pesanan</Text>
        <Text style={styles.body}>Masuk untuk melihat pesanan Anda.</Text>
        <Pressable
          onPress={() => {
            setPendingAuthRedirect("/(tabs)/orders")
            router.push({ pathname: "/(auth)/login", params: { next: "/(tabs)/orders" } })
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 8) }]}>
      <Text style={styles.header}>Pesanan</Text>
      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 12 }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {orders.length === 0 ? (
            <Text style={styles.body}>Belum ada pesanan.</Text>
          ) : (
            orders.map((order) => (
              <Pressable
                key={order.id}
                onPress={() =>
                  router.push({
                    pathname: "/order-confirmation/[orderRef]",
                    params: { orderRef: publicOrderRef(order) },
                  })
                }
                style={styles.card}
              >
                <Text style={styles.ref}>#{order.orderNumber}</Text>
                <Text numberOfLines={2} style={styles.name}>
                  {order.listingName}
                </Text>
                <Text style={styles.meta}>
                  {orderStatusLabel(order)} · {formatIDR(order.buyerTotal)}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
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
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: "800",
  },
  body: {
    color: colors.navyMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 8,
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
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    padding: 12,
  },
  ref: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "800",
  },
  name: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  meta: {
    color: colors.navyMuted,
    fontSize: 12,
    marginTop: 4,
  },
})
