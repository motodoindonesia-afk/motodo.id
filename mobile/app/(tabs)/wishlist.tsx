import { Link } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import { useAuth } from "../../features/auth/AuthContext"
import { colors } from "../../lib/theme"

export default function WishlistPlaceholder() {
  const { session } = useAuth()
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Wishlist</Text>
      <Text style={styles.body}>
        {session
          ? "Wishlist screen comes later. You can already favorite motorcycles from Home."
          : "Sign in to save motorcycles to your Motodo wishlist."}
      </Text>
      {session ? (
        <Link href="/(tabs)" style={styles.link}>
          Back to Home
        </Link>
      ) : (
        <Link href="/(auth)/login" style={styles.link}>
          Sign in
        </Link>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.page,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: "700",
  },
  body: {
    color: colors.navyMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  link: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 16,
  },
})
