import { Link, useLocalSearchParams } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import { colors } from "../lib/theme"

export default function ComingSoonScreen() {
  const { title } = useLocalSearchParams<{ title?: string }>()
  const heading = typeof title === "string" && title.trim() ? title : "Coming soon"

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{heading}</Text>
      <Text style={styles.body}>This screen is not part of the Home phase.</Text>
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
