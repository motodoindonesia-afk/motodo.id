/**
 * Development-only live connectivity check.
 * Does not create tables, users, or schema. Does not print secrets.
 *
 * Usage: node scripts/check-supabase-connection.mjs
 */
import { createServer } from "vite"

function label(ok) {
  return ok ? "DETECTED" : "MISSING"
}

function passFail(ok) {
  return ok ? "PASS" : "FAIL"
}

const server = await createServer({
  appType: "custom",
  server: { middlewareMode: true, hmr: false },
})

try {
  const mod = await server.ssrLoadModule("/src/lib/supabase.ts")
  const presence = mod.getSupabasePublicEnvPresence()
  const configured = mod.isSupabaseConfigured() === true

  console.log(`SUPABASE URL: ${label(presence.url)}`)
  console.log(`PUBLISHABLE KEY: ${label(presence.anonKey)}`)

  let clientOk = false
  try {
    const client = mod.getSupabaseClient()
    clientOk = Boolean(client && client.auth && typeof client.auth.getSession === "function")
  } catch {
    clientOk = false
  }

  console.log(`CLIENT INITIALIZATION: ${passFail(clientOk && configured)}`)

  let apiOk = false
  try {
    const ping = await mod.pingSupabaseAuthHealth()
    apiOk = ping.ok === true
  } catch {
    apiOk = false
  }

  console.log(`API CONNECTION: ${passFail(apiOk)}`)
  process.exit(apiOk && clientOk && configured ? 0 : 1)
} finally {
  await server.close()
}
