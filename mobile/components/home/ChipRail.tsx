import { Pressable, ScrollView, StyleSheet, Text } from "react-native"
import { colors } from "../../lib/theme"

export function ChipRail({
  items,
  activeId,
  onPress,
}: {
  items: { id: string; label: string }[]
  activeId?: string
  onPress: (id: string) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const active = item.id === activeId
        return (
          <Pressable key={item.id} onPress={() => onPress(item.id)} style={[styles.chip, active && styles.active]}>
            <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  chip: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  active: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  label: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "600",
  },
  activeLabel: {
    color: colors.brand,
  },
})
