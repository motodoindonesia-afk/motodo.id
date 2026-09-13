import { Ionicons } from "@expo/vector-icons"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors } from "../../lib/theme"

const expoGoPad = Constants.executionEnvironment === "storeClient" ? 40 : 0

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
      <View style={[styles.row, { paddingRight: expoGoPad }]}>
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
        <Ionicons color={colors.navyMuted} name="search" size={18} />
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
    <Pressable accessibilityLabel={label} hitSlop={8} onPress={onPress} style={styles.iconBtn}>
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
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    minHeight: 32,
  },
  logo: {
    color: colors.brand,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  iconBtn: {
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 6,
    width: 36,
  },
  badge: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    position: "absolute",
    right: 0,
    top: 0,
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
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  placeholder: {
    color: colors.navyMuted,
    flex: 1,
    fontSize: 14,
  },
})
