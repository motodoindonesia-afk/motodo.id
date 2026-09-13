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
  onPress,
  compact = false,
}: {
  listing: HomeListing
  width?: number
  favorited: boolean
  onFavorite: () => void
  onPress?: () => void
  compact?: boolean
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.card, width ? { width } : styles.cardFill]}>
      <View style={[styles.imageWrap, compact && styles.imageCompact]}>
        {listing.image ? (
          <Image resizeMode="cover" source={{ uri: listing.image }} style={styles.image} />
        ) : (
          <View style={styles.fallback} />
        )}
        <Pressable
          accessibilityLabel="Favorite"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation?.()
            onFavorite()
          }}
          style={styles.heart}
        >
          <Ionicons color={favorited ? colors.brand : colors.navy} name={favorited ? "heart" : "heart-outline"} size={15} />
        </Pressable>
      </View>
      <View style={styles.body}>
        {listing.brand ? (
          <Text numberOfLines={1} style={styles.brand}>
            {listing.brand}
          </Text>
        ) : null}
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
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: "hidden",
  },
  cardFill: {
    width: "100%",
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: colors.brandSoft,
    width: "100%",
  },
  imageCompact: {
    aspectRatio: undefined,
    height: 96,
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
    borderRadius: 12,
    height: 26,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    top: 6,
    width: 26,
  },
  body: {
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  brand: {
    color: colors.navyMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  name: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  price: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1,
  },
  meta: {
    color: colors.navyMuted,
    fontSize: 10,
  },
})
