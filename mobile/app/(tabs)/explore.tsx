import { Link } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import { colors } from "../../lib/theme"

export default function ExplorePlaceholder() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.body}>Browse filters and search land in a later phase. Home already uses the live Motodo catalog.</Text>
      <Link href="/(tabs)" style={styles.link}>
        Back to Home
      </Link>
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
