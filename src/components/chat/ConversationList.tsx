import { Link } from "react-router-dom"
import type { Conversation } from "../../types/chat"
import {
  formatChatTime,
  getConversationCounterpartyName,
  getConversationListingContext,
} from "../../lib/chat"
import { UnreadBadge } from "./UnreadBadge"
import { cn } from "../../lib/cn"

type Props = {
  conversations: Conversation[]
  selectedId?: string
  viewerId: string
  role: "buyer" | "seller"
  hrefFor: (id: string) => string
}

export function ConversationList({ conversations, selectedId, viewerId, role, hrefFor }: Props) {
  return (
    <ul className="divide-y divide-line">
      {conversations.map((conversation) => {
        const listing = getConversationListingContext(conversation)
        const unread = role === "buyer" ? conversation.unreadForBuyer : conversation.unreadForSeller
        const photo = listing.image || conversation.listingImage
        return (
          <li key={conversation.id}>
            <Link
              to={hrefFor(conversation.id)}
              className={cn(
                "flex gap-3 px-4 py-3 hover:bg-surface",
                selectedId === conversation.id && "bg-surface",
              )}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                {photo ? (
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-navy-muted">No photo</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-navy">{listing.name}</p>
                  <p className="shrink-0 text-xs text-navy-muted">{formatChatTime(conversation.lastMessageAt)}</p>
                </div>
                <p className="mt-0.5 truncate text-xs text-navy-muted">
                  {getConversationCounterpartyName(conversation, viewerId)}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className={cn("truncate text-sm text-navy-muted", unread > 0 && "font-medium text-navy")}>
                    {conversation.lastMessage || "No messages yet."}
                  </p>
                  <UnreadBadge count={unread} />
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
