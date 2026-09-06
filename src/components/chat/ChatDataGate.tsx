import type { ReactNode } from "react"
import { isChatReady } from "../../lib/chat"
import { useChatLive } from "../../lib/useChatLive"

export function ChatDataGate({ children }: { children: ReactNode }) {
  useChatLive()
  if (!isChatReady()) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }
  return children
}
