/**
 * Client refresh contract.
 *
 * Authoritative: RPC / table mutation return values and subsequent fetches.
 * Web may also fire CustomEvent via notifyWebCache (same-tab React). That is optional UI.
 *
 * Mobile MUST NOT depend on CustomEvent, StorageEvent, or window buses.
 * Mobile: screen focus → fetch/refetch.
 *
 * Realtime (keep): messages, notifications (Supabase postgres_changes).
 * Do not add listing/order Realtime in Phase 1.
 */
export const CLIENT_REFRESH = {
  webOptionalCacheEvent: true,
  mobileFocusRefetch: true,
  realtimeTables: ["messages", "conversations", "notifications"] as const,
} as const
