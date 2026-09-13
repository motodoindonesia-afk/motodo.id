import { useState } from "react"
import { Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import { colors } from "../../lib/theme"

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const { width } = useWindowDimensions()
  const height = Math.round(width * 0.92)
  const [index, setIndex] = useState(0)
  const pages = images.length > 0 ? images : [null]

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1))
    if (next !== index && next >= 0 && next < pages.length) setIndex(next)
  }

  return (
    <View style={[styles.wrap, { width, height }]}>
      <ScrollView
        horizontal
        onMomentumScrollEnd={onScroll}
        onScroll={onScroll}
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        {pages.map((uri, pageIndex) => (
          <View key={`${uri ?? "empty"}-${pageIndex}`} style={{ height, width }}>
            {uri ? (
              <Image accessibilityLabel={alt} resizeMode="cover" source={{ uri }} style={styles.image} />
            ) : (
              <View style={styles.fallback}>
                <Text style={styles.fallbackText}>Foto belum tersedia</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      {pages.length > 1 ? (
        <View style={styles.dots}>
          {pages.map((_, pageIndex) => (
            <View key={pageIndex} style={[styles.dot, pageIndex === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
      {pages.length > 1 ? (
        <View style={styles.count}>
          <Text style={styles.countText}>
            {index + 1}/{pages.length}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.navy,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  fallback: {
    alignItems: "center",
    backgroundColor: colors.brandSoft,
    flex: 1,
    justifyContent: "center",
  },
  fallbackText: {
    color: colors.navyMuted,
    fontSize: 13,
  },
  dots: {
    alignItems: "center",
    bottom: 12,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 16,
  },
  count: {
    backgroundColor: "rgba(11,31,58,0.72)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: "absolute",
    right: 12,
    top: 12,
  },
  countText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
})
