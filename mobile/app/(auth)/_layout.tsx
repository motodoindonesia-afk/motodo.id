import type { Href } from "expo-router"
import { Redirect, Stack, useLocalSearchParams } from "expo-router"
import { useRef } from "react"
import { ActivityIndicator, View } from "react-native"
import { useAuth } from "../../features/auth/AuthContext"
import { consumePendingAuthRedirect } from "../../lib/authRedirect"
import { colors } from "../../lib/theme"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function redirectAfterAuth(next?: string, buyNow?: string): Href {
  if (next?.startsWith("/motorcycles/")) {
    const id = next.replace("/motorcycles/", "").split("?")[0]
    if (id) {
      return {
        pathname: "/motorcycles/[id]",
        params: buyNow === "1" ? { id, buyNow: "1" } : { id },
      }
    }
  }
  if (next === "/cart") return "/cart"
  if (next?.startsWith("/sellers/")) {
    const sellerId = next.replace("/sellers/", "").split("/")[0]
    if (sellerId) return { pathname: "/sellers/[sellerId]", params: { sellerId } }
  }
  if (next?.startsWith("/messages/")) {
    const id = next.replace("/messages/", "").split("/")[0]
    if (id) return { pathname: "/messages/[id]", params: { id } }
  }
  return "/(tabs)"
}

export default function AuthLayout() {
  const { session, loading } = useAuth()
  const params = useLocalSearchParams<{ next?: string; buyNow?: string }>()
  const hrefRef = useRef<Href | null>(null)

  if (!session) hrefRef.current = null

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  if (session) {
    if (!hrefRef.current) {
      const pending = consumePendingAuthRedirect()
      hrefRef.current = redirectAfterAuth(first(params.next) ?? pending.next, first(params.buyNow) ?? pending.buyNow)
    }
    return <Redirect href={hrefRef.current} />
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} />
}
