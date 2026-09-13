/**
 * Platform-agnostic Supabase client factory (web + future native).
 * Does not read Vite env, window, or localStorage.
 *
 * Web wiring: src/lib/supabase.ts (VITE_* + detectSessionInUrl: true, default browser storage).
 * Native: pass url/anonKey from Expo extra and authStorage (SecureStore/AsyncStorage). Do not use this
 * module to implement native storage — only the factory boundary.
 */

import { createClient, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js"

export type CreateSupabaseClientOptions = {
  url: string
  anonKey: string
  /** Omit on web to keep GoTrue’s default (localStorage). Native must pass a storage adapter. */
  authStorage?: SupportedStorage
  detectSessionInUrl?: boolean
  persistSession?: boolean
  autoRefreshToken?: boolean
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

export function isUsableSupabaseUrl(url: string, allowHttp = false) {
  if (!url || looksLikePlaceholder(url)) return false
  try {
    const parsed = new URL(url)
    if (allowHttp && parsed.protocol === "http:") return Boolean(parsed.host)
    return parsed.protocol === "https:" && Boolean(parsed.host)
  } catch {
    return false
  }
}

export function isUsableAnonKey(key: string) {
  if (!key || looksLikePlaceholder(key)) return false
  return key.length >= 20
}

export function hasUsableSupabasePublicCredentials(url: string, anonKey: string, allowHttp = false) {
  return isUsableSupabaseUrl(url, allowHttp) && isUsableAnonKey(anonKey)
}

export function createSupabaseClient(options: CreateSupabaseClientOptions): SupabaseClient {
  const auth: {
    persistSession: boolean
    autoRefreshToken: boolean
    detectSessionInUrl: boolean
    storage?: SupportedStorage
  } = {
    persistSession: options.persistSession ?? true,
    autoRefreshToken: options.autoRefreshToken ?? true,
    detectSessionInUrl: options.detectSessionInUrl ?? false,
  }
  if (options.authStorage) auth.storage = options.authStorage

  return createClient(options.url, options.anonKey, { auth })
}
