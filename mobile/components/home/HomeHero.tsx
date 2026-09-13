import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { colors } from "../../lib/theme"
import type { HomeListing } from "../../types/marketplace"

export function HomeHero({
  listing,
  onExplore,
  onGarages,
}: {
  listing: HomeListing | null
  onExplore: () => void
  onGarages: () => void
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {listing?.image ? <Image resizeMode="cover" source={{ uri: listing.image }} style={styles.image} /> : null}
        <View style={styles.scrim} />
        <View style={styles.copy}>
          <Text style={styles.title}>Temukan Motor Custom Impianmu</Text>
          <Text style={styles.body}>Jelajahi custom build dari garage pilihan di Indonesia.</Text>
          <View style={styles.actions}>
            <Pressable onPress={onExplore} style={styles.primary}>
              <Text style={styles.primaryText}>Jelajahi Motor</Text>
            </Pressable>
            <Pressable onPress={onGarages} style={styles.secondary}>
              <Text style={styles.secondaryText}>Temukan Garage</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    minHeight: 168,
    overflow: "hidden",
  },
  image: {
    bottom: 0,
    left: 0,
    opacity: 0.55,
    position: "absolute",
    right: 0,
    top: 0,
  },
  scrim: {
    backgroundColor: "rgba(11, 31, 58, 0.42)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  copy: {
    padding: 16,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  body: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 280,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  primary: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700",
  },
  secondary: {
    borderColor: "rgba(255,255,255,0.45)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
})
