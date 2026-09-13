import { hasUsableSupabasePublicCredentials } from "../../src/lib/platform/supabaseClient"

function readPublicEnv(name: "EXPO_PUBLIC_SUPABASE_URL" | "EXPO_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name]
  return typeof value === "string" ? value.trim() : ""
}

export function getMobileSupabasePublicConfig() {
  return {
    url: readPublicEnv("EXPO_PUBLIC_SUPABASE_URL"),
    anonKey: readPublicEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  }
}

export function isMobileSupabaseConfigured() {
  const { url, anonKey } = getMobileSupabasePublicConfig()
  return hasUsableSupabasePublicCredentials(url, anonKey)
}
