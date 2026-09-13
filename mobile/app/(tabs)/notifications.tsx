import { StyleSheet, Text, View } from "react-native"
import { colors } from "../../lib/theme"

export default function NotificationsPlaceholder() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Notifikasi</Text>
      <Text style={styles.body}>Belum ada notifikasi untuk ditampilkan. Inbox Motodo akan tampil di sini.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.page,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: "700",
  },
  body: {
    color: colors.navyMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
})
