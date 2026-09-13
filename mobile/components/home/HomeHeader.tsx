import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors } from "../../lib/theme"

export function HomeHeader({
  cartCount,
  messageCount,
  onSearch,
}: {
  cartCount: number
  messageCount: number
  onSearch: () => void
}) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.row}>
        <Text style={styles.logo}>MOTODO</Text>
        <View style={styles.actions}>
          <HeaderIcon
            name="cart-outline"
            count={cartCount}
            label="Cart"
            onPress={() => router.push("/cart")}
          />
          <HeaderIcon
            name="chatbubble-ellipses-outline"
            count={messageCount}
            label="Messages"
            onPress={() => router.push({ pathname: "/coming-soon", params: { title: "Messages" } })}
          />
        </View>
      </View>
      <Pressable onPress={onSearch} style={styles.search}>
        <Ionicons color={colors.navyMuted} name="search" size={16} />
        <Text numberOfLines={1} style={styles.placeholder}>
          Cari motor, brand, atau gaya...
        </Text>
      </Pressable>
    </View>
  )
}

function HeaderIcon({
  name,
  count,
  label,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap
  count: number
  label: string
  onPress: () => void
}) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={styles.iconBtn}>
      <Ionicons color={colors.navy} name={name} size={22} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : String(count)}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    minHeight: 44,
    width: "100%",
  },
  logo: {
    color: colors.brand,
    flexShrink: 0,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    marginRight: -10,
  },
  iconBtn: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  badge: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    position: "absolute",
    right: 6,
    top: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  placeholder: {
    color: colors.navyMuted,
    flex: 1,
    fontSize: 13,
  },
})
