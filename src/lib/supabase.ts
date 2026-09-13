import { type SupabaseClient } from "@supabase/supabase-js"
import {
  createSupabaseClient,
  hasUsableSupabasePublicCredentials,
} from "./platform/supabaseClient"

export { createSupabaseClient, type CreateSupabaseClientOptions } from "./platform/supabaseClient"

function readPublicEnv(name: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"): string {
  const value = import.meta.env[name]
  return typeof value === "string" ? value.trim() : ""
}

/** True when public URL + anon key are present and look usable. Never logs their values. */
export function hasValidSupabasePublicConfig() {
  return hasUsableSupabasePublicCredentials(
    readPublicEnv("VITE_SUPABASE_URL"),
    readPublicEnv("VITE_SUPABASE_ANON_KEY"),
    Boolean(import.meta.env.DEV),
  )
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
  return createSupabaseClient({
    url: readPublicEnv("VITE_SUPABASE_URL"),
    anonKey: readPublicEnv("VITE_SUPABASE_ANON_KEY"),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
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
