import type { ReactNode } from "react"
import { isNotificationsReady } from "../../lib/notifications"
import { useNotificationsLive } from "../../lib/useNotificationsLive"

export function NotificationsDataGate({ children }: { children: ReactNode }) {
  useNotificationsLive()
  if (!isNotificationsReady()) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }
  return children
}
