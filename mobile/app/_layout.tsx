import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { AuthProvider } from "../features/auth/AuthContext"
import { FavoritesProvider } from "../features/favorites/FavoritesContext"
import { colors } from "../lib/theme"

export default function RootLayout() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.white },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="coming-soon" options={{ headerShown: true, title: "Motodo", headerBackTitle: "Home" }} />
        </Stack>
      </FavoritesProvider>
    </AuthProvider>
  )
}
