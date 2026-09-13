import { StyleSheet, View } from "react-native"
import { colors } from "../../lib/theme"

export function SkeletonBox({ width, height, radius = 8 }: { width: number; height: number; radius?: number }) {
  return <View style={[styles.box, { width, height, borderRadius: radius }]} />
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.line,
  },
})
