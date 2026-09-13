import { Redirect, Stack } from "expo-router"
import { ActivityIndicator, View } from "react-native"
import { useAuth } from "../../features/auth/AuthContext"
import { colors } from "../../lib/theme"

export default function AuthLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  if (session) {
    return <Redirect href="/(tabs)" />
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} />
}
