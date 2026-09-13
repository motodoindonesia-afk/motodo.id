import { useLocalSearchParams } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import { colors } from "../../lib/theme"

export default function SellerStorePlaceholder() {
  const { sellerId } = useLocalSearchParams<{ sellerId?: string }>()
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Toko Seller</Text>
      <Text style={styles.body}>
        Halaman toko seller lengkap belum menjadi bagian Phase 2C. Identitas seller sudah terhubung: {sellerId ?? "—"}.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    flex: 1,
    padding: 24,
  },
  title: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: "800",
  },
  body: {
    color: colors.navyMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
})
