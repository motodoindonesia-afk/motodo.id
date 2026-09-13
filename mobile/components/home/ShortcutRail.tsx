import { Ionicons } from "@expo/vector-icons"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { colors } from "../../lib/theme"

export type HomeShortcut = {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

export function ShortcutRail({
  items,
  activeId,
  onPress,
}: {
  items: HomeShortcut[]
  activeId: string
  onPress: (id: string) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const active = item.id === activeId
        return (
          <Pressable key={item.id} onPress={() => onPress(item.id)} style={styles.item}>
            <View style={[styles.icon, active && styles.iconActive]}>
              <Ionicons color={active ? colors.white : colors.brand} name={item.icon} size={20} />
            </View>
            <Text numberOfLines={2} style={styles.label}>
              {item.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    alignItems: "center",
    width: 64,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.brandSoft,
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  iconActive: {
    backgroundColor: colors.brand,
  },
  label: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
})
