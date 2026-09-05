import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { Link } from "react-router-dom"
import type { ChatMessage, Conversation } from "../../types/chat"
import {
  formatAvailableForChat,
  formatMessageTime,
  getConversationListingContext,
  getMessages,
  sendMessage,
} from "../../lib/chat"
import { useChatLive } from "../../lib/useChatLive"
import { Button } from "../ui/Button"
import { cn } from "../../lib/cn"

type Props = {
  conversation: Conversation
  userId: string
  backHref: string
}

export function ChatThread({ conversation, userId, backHref }: Props) {
  useChatLive()
  const messages = getMessages(conversation.id)
  const listing = getConversationListingContext(conversation)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const isBuyerMessage = (message: ChatMessage) => message.senderRole === "buyer"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length, conversation.id])

  function handleSend(event?: FormEvent) {
    event?.preventDefault()
    const text = draft.trim()
    if (!text) {
      setError("Enter a message before sending.")
      return
    }
    const saved = sendMessage(conversation.id, userId, text)
    if (!saved) {
      setError("Unable to send this message.")
      return
    }
    setDraft("")
    setError("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex min-h-[520px] flex-col lg:min-h-[560px]">
      <div className="flex items-start gap-3 border-b border-line px-4 py-3">
        <Link to={backHref} className="mt-2 text-sm font-medium text-brand hover:text-brand-hover lg:hidden">
          Back
        </Link>
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
          {listing.image ? (
            <img src={listing.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-navy-muted">No photo</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-navy">{listing.name}</h2>
            {listing.status === "sold" ? (
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy">
                Sold
              </span>
            ) : null}
          </div>
          {listing.status === "missing" ? (
            <p className="mt-1 text-sm text-navy-muted">This listing is no longer available.</p>
          ) : (
            <>
              {listing.price ? <p className="mt-0.5 text-sm font-semibold text-brand">{listing.price}</p> : null}
              {listing.status === "sold" ? null : (
                <p className="mt-0.5 text-xs text-navy-muted">{formatAvailableForChat(listing.quantity)}</p>
              )}
            </>
          )}
          {listing.status === "missing" ? null : (
            <Link
              to={`/motorcycles/${conversation.listingId}`}
              className="mt-1 inline-flex text-sm font-medium text-brand hover:text-brand-hover"
            >
              View Listing
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-white px-4 py-4">
        {messages.map((message) => {
          const buyerMessage = isBuyerMessage(message)
          const mine = message.senderId === userId
          return (
            <div key={message.id} className={cn("flex", buyerMessage ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5",
                  buyerMessage ? "bg-brand text-white" : "bg-surface text-navy",
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p>
                <p className={cn("mt-1 text-[11px]", buyerMessage ? "text-white/80" : "text-navy-muted")}>
                  {formatMessageTime(message.createdAt)}
                  {mine ? (message.read ? " · Read" : " · Sent") : null}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form className="border-t border-line p-3" onSubmit={handleSend}>
        <label htmlFor="chat-message" className="sr-only">
          Type a message
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="chat-message"
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-11 w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-navy placeholder:text-navy-muted/80 focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <Button type="submit">Send</Button>
        </div>
        {error ? (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  )
}
