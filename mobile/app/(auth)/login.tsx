import { Link } from "expo-router"
import { useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useAuth } from "../../features/auth/AuthContext"
import { colors } from "../../lib/theme"

export default function LoginScreen() {
  const { signIn, configured } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit() {
    setError(null)
    if (!configured) {
      setError("Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env.local")
      return
    }
    setBusy(true)
    try {
      await signIn(email, password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.mark}>MOTODO</Text>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.hint}>Same account as Motodo Web.</Text>

        {!configured ? (
          <Text style={styles.warn}>
            Supabase env is not configured. Copy mobile/.env.example to .env.local using the web project URL and anon
            key.
          </Text>
        ) : null}

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.navyMuted}
          style={styles.input}
          value={email}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.navyMuted}
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable disabled={busy} onPress={() => void onSubmit()} style={styles.button}>
          <Text style={styles.buttonText}>{busy ? "Signing in…" : "Sign in"}</Text>
        </Pressable>

        <Link href="/(auth)/register" style={styles.link}>
          Create an account
        </Link>
        <Link href="/(tabs)" style={styles.link}>
          Browse without signing in
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  mark: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: "700",
  },
  hint: {
    color: colors.navyMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  warn: {
    color: colors.navy,
    backgroundColor: colors.brandSoft,
    borderRadius: 8,
    fontSize: 13,
    padding: 10,
  },
  input: {
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 14,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  link: {
    color: colors.brand,
    fontSize: 14,
    textAlign: "center",
  },
})
