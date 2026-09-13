import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors } from "../../lib/theme"

export function PdpHeader({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.row}>
        <Pressable accessibilityLabel="Back" hitSlop={4} onPress={onBack} style={styles.back}>
          <Ionicons color={colors.navy} name="chevron-back" size={28} />
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>
          Detail Motor
        </Text>
        <View style={styles.spacer} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: 4,
  },
  back: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  title: {
    color: colors.navy,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  spacer: {
    width: 44,
  },
})
