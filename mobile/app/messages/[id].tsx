import { useLocalSearchParams } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import { colors } from "../../lib/theme"

export default function ConversationPlaceholder() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Percakapan</Text>
      <Text style={styles.body}>
        Percakapan sudah dibuat melalui start_conversation. Layar chat lengkap belum menjadi bagian Phase 2C.
      </Text>
      <Text style={styles.meta}>{id}</Text>
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
  meta: {
    color: colors.navyMuted,
    fontSize: 12,
    marginTop: 12,
  },
})
