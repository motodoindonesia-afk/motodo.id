import type { ReactNode } from "react"
import { isNotificationsReady } from "../../lib/notifications"
import { useNotificationsLive } from "../../lib/useNotificationsLive"
import { EmptyState } from "../ui/EmptyState"
import { useT } from "../../i18n"

export function NotificationsDataGate({ children }: { children: ReactNode }) {
  useNotificationsLive()
  const t = useT()
  if (!isNotificationsReady()) {
    return (
      <main className="bg-white py-16">
        <div className="mx-auto max-w-md px-5">
          <EmptyState title={t("common.loading")} />
        </div>
      </main>
    )
  }
  return children
}
