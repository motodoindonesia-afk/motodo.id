import { MotodoError, motodoErrorCode, stripMotodoCodePrefix } from "../../src/lib/platform/errors"

const TECHNICAL = [
  "pgrst",
  "jwt",
  "row-level",
  "rls",
  "permission denied",
  "supabase",
  "postgres",
  "service_role",
  "does not exist",
  "column",
]

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
  return TECHNICAL.some((token) => lower.includes(token))
}

export function userFacingMessage(error: unknown, fallback: string): string {
  const code = motodoErrorCode(error)
  const raw = stripMotodoCodePrefix(rawMessage(error))
  if (code && raw && !looksTechnical(raw)) return raw
  if (!raw) return fallback
  if (looksTechnical(raw)) return fallback
  return raw
}

export { MotodoError }
