import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { AuthProvider } from "../features/auth/AuthContext"
import { CartProvider } from "../features/cart/CartContext"
import { FavoritesProvider } from "../features/favorites/FavoritesContext"
import { colors } from "../lib/theme"

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
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
          <Stack.Screen name="motorcycles/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
          <Stack.Screen name="cart" options={{ headerShown: false }} />
          <Stack.Screen name="checkout/[listingId]" options={{ headerShown: false }} />
          <Stack.Screen name="sellers/[sellerId]" options={{ headerShown: true, title: "Toko Seller", headerBackTitle: "Back" }} />
          <Stack.Screen name="messages/[id]" options={{ headerShown: true, title: "Chat", headerBackTitle: "Back" }} />
        </Stack>
      </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  )
}
