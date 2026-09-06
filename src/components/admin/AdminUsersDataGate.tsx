import type { ReactNode } from "react"
import { isAdminUsersHydrated } from "../../lib/adminUsersSupabase"
import { useAdminUsersLive } from "../../lib/useAdminUsersLive"

export function AdminUsersDataGate({ children }: { children: ReactNode }) {
  useAdminUsersLive()
  if (!isAdminUsersHydrated()) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }
  return children
}
