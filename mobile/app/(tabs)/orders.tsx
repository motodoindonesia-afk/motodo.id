import { Link } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import { useAuth } from "../../features/auth/AuthContext"
import { colors } from "../../lib/theme"

export default function OrdersPlaceholder() {
  const { session } = useAuth()
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Orders</Text>
      <Text style={styles.body}>Orders land in a later commerce phase.</Text>
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
