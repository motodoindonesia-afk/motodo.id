import { ScrollView, StyleSheet, View } from "react-native"
import type { HomeListing } from "../../types/marketplace"
import { ProductCard } from "./ProductCard"
import { SkeletonBox } from "./SkeletonBox"

export function ListingRail({
  listings,
  loading,
  favorited,
  onFavorite,
}: {
  listings: HomeListing[]
  loading: boolean
  favorited: (id: string) => boolean
  onFavorite: (listing: HomeListing) => void
}) {
  if (loading) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.skel}>
            <SkeletonBox height={96} radius={12} width={148} />
            <SkeletonBox height={14} radius={4} width={120} />
            <SkeletonBox height={12} radius={4} width={80} />
          </View>
        ))}
      </ScrollView>
    )
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {listings.map((listing) => (
        <ProductCard
          compact
          favorited={favorited(listing.id)}
          key={listing.id}
          listing={listing}
          onFavorite={() => onFavorite(listing)}
          width={148}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  skel: {
    gap: 8,
    width: 148,
  },
})
