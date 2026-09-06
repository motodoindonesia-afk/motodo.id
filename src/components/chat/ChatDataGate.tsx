import type { ReactNode } from "react"
import { isChatReady } from "../../lib/chat"
import { useChatLive } from "../../lib/useChatLive"
import { EmptyState } from "../ui/EmptyState"
import { useT } from "../../i18n"

export function ChatDataGate({ children }: { children: ReactNode }) {
  useChatLive()
  const t = useT()
  if (!isChatReady()) {
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
