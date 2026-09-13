import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { colors } from "../../lib/theme"

export function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string
  onSeeAll?: () => void
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAll ? (
        <Pressable hitSlop={8} onPress={onSeeAll} style={styles.link}>
          <Text style={styles.linkText}>Lihat Semua</Text>
          <Ionicons color={colors.brand} name="chevron-forward" size={14} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  title: {
    color: colors.navy,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    paddingRight: 12,
  },
  link: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  linkText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "600",
  },
})
