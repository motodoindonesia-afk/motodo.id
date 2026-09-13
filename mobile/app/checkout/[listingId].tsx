import { useLocalSearchParams, useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { colors } from "../../lib/theme"

export default function CheckoutPlaceholder() {
  const { listingId } = useLocalSearchParams<{ listingId?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const id = Array.isArray(listingId) ? listingId[0] : listingId

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 12) }]}>
      <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/cart"))} style={styles.back}>
        <Ionicons color={colors.navy} name="chevron-back" size={28} />
      </Pressable>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.body}>
        Checkout native belum dibuka. Item yang dipilih sudah siap: {id ?? "—"}. Pesanan tidak dibuat di langkah ini.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: 16,
  },
  back: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  title: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
  },
  body: {
    color: colors.navyMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
})
