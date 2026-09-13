import { StyleSheet, View } from "react-native"
import type { HomeListing } from "../../types/marketplace"
import { ProductCard } from "./ProductCard"
import { SkeletonBox } from "./SkeletonBox"

export function ProductGrid({
  listings,
  loading,
  cardWidth,
  gap,
  favorited,
  onFavorite,
}: {
  listings: HomeListing[]
  loading: boolean
  cardWidth: number
  gap: number
  favorited: (id: string) => boolean
  onFavorite: (listing: HomeListing) => void
}) {
  if (loading) {
    return (
      <View style={[styles.grid, { gap }]}>
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBox height={cardWidth + 88} key={index} radius={12} width={cardWidth} />
        ))}
      </View>
    )
  }

  return (
    <View style={[styles.grid, { gap }]}>
      {listings.map((listing) => (
        <ProductCard
          favorited={favorited(listing.id)}
          key={listing.id}
          listing={listing}
          onFavorite={() => onFavorite(listing)}
          width={cardWidth}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
})
