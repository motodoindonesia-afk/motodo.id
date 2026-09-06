import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function readPublicEnv(name: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"): string {
  const value = import.meta.env[name]
  return typeof value === "string" ? value.trim() : ""
}

function looksLikePlaceholder(value: string) {
  const lower = value.toLowerCase()
  return (
    lower.includes("your_project") ||
    lower.includes("your_anon") ||
    lower.includes("your_supabase") ||
    lower.includes("placeholder")
  )
}

function isValidSupabaseUrl(url: string) {
  if (!url || looksLikePlaceholder(url)) return false
  try {
    const parsed = new URL(url)
    if (import.meta.env.DEV && parsed.protocol === "http:") return Boolean(parsed.host)
    return parsed.protocol === "https:" && Boolean(parsed.host)
  } catch {
    return false
  }
}

function isValidAnonKey(key: string) {
  if (!key || looksLikePlaceholder(key)) return false
  return key.length >= 20
}

/** True when public URL + anon key are present and look usable. Never logs their values. */
export function hasValidSupabasePublicConfig() {
  return isValidSupabaseUrl(readPublicEnv("VITE_SUPABASE_URL")) && isValidAnonKey(readPublicEnv("VITE_SUPABASE_ANON_KEY"))
}

/**
 * True when the app should talk to Supabase.
 * Production with missing/invalid env is not configured (and must not use mock).
 */
export function isSupabaseConfigured(): boolean {
  return hasValidSupabasePublicConfig()
}

/** Dev-only: mock/localStorage marketplace when Supabase public env is missing. */
export function isMockMarketplaceAllowed(): boolean {
  return import.meta.env.DEV && !hasValidSupabasePublicConfig()
}

/** Production build with missing or invalid public Supabase env. Never fall back to mock. */
export function isProductionConfigBlocked(): boolean {
  return import.meta.env.PROD && !hasValidSupabasePublicConfig()
}

function createBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  return createClient(readPublicEnv("VITE_SUPABASE_URL"), readPublicEnv("VITE_SUPABASE_ANON_KEY"), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

/** Single browser client. Null when public env is missing or invalid. */
export const supabase: SupabaseClient | null = createBrowserClient()

/** Throws a clear error if called before a valid public Supabase config exists. */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase is not configured.")
  }
  return supabase
}

/** Presence flags only. Never return or log secret values. */
export function getSupabasePublicEnvPresence(): { url: boolean; anonKey: boolean } {
  return {
    url: Boolean(readPublicEnv("VITE_SUPABASE_URL")),
    anonKey: Boolean(readPublicEnv("VITE_SUPABASE_ANON_KEY")),
  }
}

/**
 * Harmless GoTrue health ping. Does not create tables, users, sessions, or schema.
 * Not called from production UI. Uses the anon/publishable key only.
 */
export async function pingSupabaseAuthHealth(): Promise<{ ok: boolean; httpStatus: number | null }> {
  const url = readPublicEnv("VITE_SUPABASE_URL").replace(/\/$/, "")
  const key = readPublicEnv("VITE_SUPABASE_ANON_KEY")
  if (!url || !key) return { ok: false, httpStatus: null }

  const response = await fetch(`${url}/auth/v1/health`, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })

  return { ok: response.ok, httpStatus: response.status }
}
