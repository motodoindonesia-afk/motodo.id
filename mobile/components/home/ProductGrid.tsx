import { StyleSheet, View } from "react-native"
import { colors } from "../../lib/theme"
import type { HomeListing } from "../../types/marketplace"
import { ProductCard } from "./ProductCard"

export function ProductGrid({
  listings,
  loading,
  favorited,
  onFavorite,
  onPress,
}: {
  listings: HomeListing[]
  loading: boolean
  favorited: (id: string) => boolean
  onFavorite: (listing: HomeListing) => void
  onPress?: (listing: HomeListing) => void
}) {
  if (loading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.cell}>
            <View style={styles.skelImage} />
            <View style={styles.skelLine} />
            <View style={[styles.skelLine, styles.skelShort]} />
          </View>
        ))}
      </View>
    )
  }

  return (
    <View style={styles.grid}>
      {listings.map((listing) => (
        <View key={listing.id} style={styles.cell}>
          <ProductCard
            favorited={favorited(listing.id)}
            listing={listing}
            onFavorite={() => onFavorite(listing)}
            onPress={onPress ? () => onPress(listing) : undefined}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  cell: {
    paddingBottom: 8,
    paddingHorizontal: 4,
    width: "50%",
  },
  skelImage: {
    aspectRatio: 1,
    backgroundColor: colors.line,
    borderRadius: 10,
    width: "100%",
  },
  skelLine: {
    backgroundColor: colors.line,
    borderRadius: 4,
    height: 10,
    marginTop: 8,
    width: "88%",
  },
  skelShort: {
    width: "56%",
  },
})
