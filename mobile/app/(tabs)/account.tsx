import { Link } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useAuth } from "../../features/auth/AuthContext"
import { colors } from "../../lib/theme"

export default function AccountTab() {
  const { session, signOut } = useAuth()
  const email = session?.user.email

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Account</Text>
      {session ? (
        <>
          <Text style={styles.body}>Signed in as {email}</Text>
          <Pressable onPress={() => void signOut()} style={styles.button}>
            <Text style={styles.buttonText}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.body}>Sign in with the same Motodo account used on the web.</Text>
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
          </Link>
        </>
      )}
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
  link: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 16,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: colors.navy,
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
})
