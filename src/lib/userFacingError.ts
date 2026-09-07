/**
 * Maps PostgREST / Postgres / GoTrue errors to copy that is safe to show in the UI.
 * Machine-readable Motodo codes live in details/hint / "CODE: " prefix (see platform/errors.ts).
 */

import { MotodoError, motodoErrorCode, stripMotodoCodePrefix } from "./platform/errors"

const TECHNICAL = [
  "pgrst",
  "jwt",
  "row-level",
  "rls",
  "permission denied",
  "violates",
  "relation ",
  "column ",
  "function public.",
  "function auth.",
  "syntax error",
  "stack depth",
  "supabase",
  "service_role",
  "postgres",
  "42p01",
  "42501",
  "23503",
  "23505",
  "23514",
  "22p02",
  "infinite recursion",
  "schema cache",
  "could not find the",
  "null value in column",
  "foreign key",
  "check constraint",
  "duplicate key",
  "search_path",
  "security definer",
  "webhook",
  "apikey",
  "bearer ",
]

const ALIASES: Record<string, string> = {
  "not authenticated": "You must be logged in.",
  "not authorized": "You don't have permission to do that.",
  listing_not_found: "Motorcycle listing not found.",
  self_chat: "You cannot message yourself.",
}

function rawMessage(error: unknown): string {
  if (typeof error === "string") return error.trim()
  if (error instanceof Error) return error.message.trim()
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") return message.trim()
  }
  return ""
}

function looksTechnical(message: string) {
  const lower = message.toLowerCase()
  if (message.length > 180) return true
  if (/error\s+\d{3}/i.test(message)) return true
  return TECHNICAL.some((token) => lower.includes(token))
}

export function userFacingMessage(error: unknown, fallback: string): string {
  const code = motodoErrorCode(error)
  const raw = stripMotodoCodePrefix(rawMessage(error))
  if (code && raw && !looksTechnical(raw)) return raw
  if (!raw) return fallback
  const alias = ALIASES[raw.toLowerCase()]
  if (alias) return alias
  if (looksTechnical(raw)) return fallback
  return raw
}

export function throwUserFacing(error: unknown, fallback: string): never {
  throw new MotodoError(userFacingMessage(error, fallback), motodoErrorCode(error))
}

export { MotodoError, motodoErrorCode }
