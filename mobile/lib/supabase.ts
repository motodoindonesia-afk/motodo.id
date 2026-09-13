/**
 * Motodo Mobile Supabase client.
 * Uses Phase 1 createSupabaseClient. Do not import web src/lib/supabase.ts.
 */
import { createSupabaseClient } from "../../src/lib/platform/supabaseClient"
import { secureAuthStorage } from "./authStorage"
import { getMobileSupabasePublicConfig, isMobileSupabaseConfigured } from "./env"

function createMobileClient() {
  if (!isMobileSupabaseConfigured()) return null
  const { url, anonKey } = getMobileSupabasePublicConfig()
  return createSupabaseClient({
    url,
    anonKey,
    authStorage: secureAuthStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  })
}

export const supabase = createMobileClient()

export function getMobileSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.")
  }
  return supabase
}
