/**
 * Web same-tab UI refresh only (CustomEvent).
 * Classification: A — not business/data correctness.
 *
 * RPC/table success is authoritative even if this no-ops (no window, native, tests).
 * Mobile must refetch on screen focus instead of listening for these events.
 * Realtime stays on Supabase postgres_changes for chat and notifications only.
 */
export function notifyWebCache(eventName: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(eventName))
}
