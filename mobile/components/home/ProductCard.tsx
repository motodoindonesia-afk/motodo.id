import { Ionicons } from "@expo/vector-icons"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { formatIDR } from "../../lib/format"
import { colors } from "../../lib/theme"
import type { HomeListing } from "../../types/marketplace"

export function ProductCard({
  listing,
  width,
  favorited,
  onFavorite,
  compact = false,
}: {
  listing: HomeListing
  width: number
  favorited: boolean
  onFavorite: () => void
  compact?: boolean
}) {
  const imageHeight = compact ? 96 : Math.round(width * 0.92)
  return (
    <View style={[styles.card, { width }]}>
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        {listing.image ? (
          <Image resizeMode="cover" source={{ uri: listing.image }} style={styles.image} />
        ) : (
          <View style={styles.fallback} />
        )}
        <Pressable accessibilityLabel="Favorite" hitSlop={10} onPress={onFavorite} style={styles.heart}>
          <Ionicons color={favorited ? colors.brand : colors.navy} name={favorited ? "heart" : "heart-outline"} size={16} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {listing.name}
        </Text>
        <Text numberOfLines={1} style={styles.price}>
          {formatIDR(listing.price)}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {[listing.city, listing.sellerName].filter(Boolean).join(" · ")}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageWrap: {
    backgroundColor: colors.brandSoft,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  fallback: {
    backgroundColor: colors.brandSoft,
    flex: 1,
  },
  heart: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    top: 8,
    width: 28,
  },
  body: {
    gap: 3,
    padding: 8,
  },
  name: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
    minHeight: 34,
  },
  price: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  meta: {
    color: colors.navyMuted,
    fontSize: 11,
  },
})
