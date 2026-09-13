import { Ionicons } from "@expo/vector-icons"
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { colors } from "../../lib/theme"
import type { HomeGarage } from "../../types/marketplace"
import { SkeletonBox } from "./SkeletonBox"

export function GarageRail({
  garages,
  loading,
  onPress,
}: {
  garages: HomeGarage[]
  loading: boolean
  onPress?: (garage: HomeGarage) => void
}) {
  if (loading) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBox height={148} key={index} radius={12} width={220} />
        ))}
      </ScrollView>
    )
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {garages.map((garage) => (
        <Pressable key={garage.id} onPress={() => onPress?.(garage)} style={styles.card}>
          {garage.coverUrl ? <Image resizeMode="cover" source={{ uri: garage.coverUrl }} style={styles.cover} /> : <View style={styles.coverFallback} />}
          <View style={styles.body}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.name}>
                {garage.businessName}
              </Text>
              <Ionicons color={colors.brand} name="checkmark-circle" size={14} />
            </View>
            <Text numberOfLines={1} style={styles.meta}>
              {[garage.city, garage.listingCount ? `${garage.listingCount} motor` : null, garage.ratingAverage != null ? `${garage.ratingAverage.toFixed(1)} · ${garage.ratingCount}` : null]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
        </Pressable>
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
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    width: 220,
  },
  cover: {
    backgroundColor: colors.brandSoft,
    height: 96,
    width: "100%",
  },
  coverFallback: {
    backgroundColor: colors.navy,
    height: 96,
  },
  body: {
    gap: 4,
    padding: 10,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  name: {
    color: colors.navy,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: colors.navyMuted,
    fontSize: 11,
  },
})
