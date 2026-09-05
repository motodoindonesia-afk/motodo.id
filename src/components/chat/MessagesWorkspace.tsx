import { useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  canAccessConversation,
  getBuyerConversations,
  getConversation,
  getSellerConversations,
  markConversationAsRead,
} from "../../lib/chat"
import { useChatLive } from "../../lib/useChatLive"
import { ConversationList } from "./ConversationList"
import { ChatThread } from "./ChatThread"
import { Button } from "../ui/Button"
import { Container } from "../layout/Container"
import { cn } from "../../lib/cn"

type Props = {
  role: "buyer" | "seller"
}

export function MessagesWorkspace({ role }: Props) {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const version = useChatLive()
  const userId = user?.id
  const selected = conversationId ? getConversation(conversationId) : null
  const allowed = Boolean(userId && canAccessConversation(selected, userId, role))

  useEffect(() => {
    if (conversationId && allowed && userId) markConversationAsRead(conversationId, userId)
  }, [conversationId, userId, allowed, version])

  if (!user) return null

  const conversations = role === "buyer" ? getBuyerConversations(user.id) : getSellerConversations(user.id)
  const listHref = role === "buyer" ? "/messages" : "/seller/messages"
  const hrefFor = (id: string) => (role === "buyer" ? `/messages/${id}` : `/seller/messages/${id}`)

  if (conversationId && !allowed) {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-lg text-center">
            <h1 className="text-2xl font-bold text-navy">Conversation not found</h1>
            <p className="mt-2 text-sm text-navy-muted">You don't have permission to access this conversation.</p>
            <Button className="mt-6" onClick={() => navigate(listHref)}>
              Back to Messages
            </Button>
          </div>
        </Container>
      </main>
    )
  }

  return (
    <main className="bg-white py-8 sm:py-10">
      <Container>
        <h1 className="text-3xl font-bold tracking-tight text-navy">Messages</h1>
        <p className="mt-2 text-navy-muted">
          {role === "seller" ? "Conversations with buyers about your listings." : "Conversations with sellers about motorcycles."}
        </p>

        {conversations.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-line px-5 py-12 text-center">
            <p className="text-base font-semibold text-navy">No messages yet.</p>
            <p className="mt-2 text-sm text-navy-muted">Start a conversation with a seller to ask about a motorcycle.</p>
            <Button className="mt-6" onClick={() => navigate("/browse")}>
              Browse Motorcycles
            </Button>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-line lg:grid lg:grid-cols-[minmax(260px,340px)_1fr]">
            <aside className={cn("border-line lg:border-r", conversationId && "hidden lg:block")}>
              <ConversationList
                conversations={conversations}
                selectedId={selected?.id}
                viewerId={user.id}
                role={role}
                hrefFor={hrefFor}
              />
            </aside>
            <section className={cn(!conversationId && "hidden lg:block")}>
              {selected && allowed ? (
                <ChatThread conversation={selected} userId={user.id} backHref={listHref} />
              ) : (
                <div className="flex min-h-[520px] items-center justify-center px-6 text-center lg:min-h-[560px]">
                  <p className="text-sm text-navy-muted">Select a conversation to read and reply.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {conversations.length > 0 && !conversationId ? (
          <p className="mt-4 text-center text-sm text-navy-muted lg:hidden">Select a conversation to open the chat.</p>
        ) : null}

        <p className="mt-6">
          <Link to="/browse" className="text-sm font-medium text-brand hover:text-brand-hover">
            Browse Motorcycles
          </Link>
        </p>
      </Container>
    </main>
  )
}
