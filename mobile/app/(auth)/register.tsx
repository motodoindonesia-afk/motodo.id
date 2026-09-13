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

export default function RegisterScreen() {
  const { signUp, configured } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit() {
    setError(null)
    setInfo(null)
    if (!configured) {
      setError("Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env.local")
      return
    }
    if (!fullName.trim()) {
      setError("Enter your name.")
      return
    }
    setBusy(true)
    try {
      const result = await signUp({ fullName, email, password })
      if (result.needsEmailConfirmation) {
        setInfo("Account created. Confirm your email, then sign in.")
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.mark}>MOTODO</Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.hint}>Email and password. Google sign-in comes later.</Text>

        <TextInput
          autoComplete="name"
          onChangeText={setFullName}
          placeholder="Full name"
          placeholderTextColor={colors.navyMuted}
          style={styles.input}
          value={fullName}
        />
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
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable disabled={busy} onPress={() => void onSubmit()} style={styles.button}>
          <Text style={styles.buttonText}>{busy ? "Creating…" : "Create account"}</Text>
        </Pressable>

        <Link href="/(auth)/login" style={styles.link}>
          Already have an account? Sign in
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
  info: {
    color: colors.navy,
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
