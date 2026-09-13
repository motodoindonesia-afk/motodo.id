import type { ChatMessage, Conversation } from "../types/chat"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"
import { notifyWebCache } from "./webCacheNotify"

export const CHAT_UPDATED_EVENT = "motodo:chat-updated"
export const MAX_CHAT_MESSAGE_LENGTH = 5000

type ConversationRow = {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  listing_name: string | null
  listing_image: string | null
  buyer_name: string | null
  created_at: string
  updated_at: string
  last_message?: string | null
  last_message_at?: string | null
  unread_for_buyer?: number | null
  unread_for_seller?: number | null
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

const conversationCache = new Map<string, Conversation>()
const messagesByConversation = new Map<string, Map<string, ChatMessage>>()
let hydrated = false

function notifyChatUpdated() {
  notifyWebCache(CHAT_UPDATED_EVENT)
}

export function isChatHydrated() {
  if (!isSupabaseConfigured()) return true
  return hydrated
}

export function setChatHydrated(value: boolean) {
  hydrated = value
  notifyChatUpdated()
}

export function clearChatCache() {
  conversationCache.clear()
  messagesByConversation.clear()
  hydrated = false
  notifyChatUpdated()
}

export function peekCachedConversations(): Conversation[] {
  return [...conversationCache.values()].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
}

export function peekCachedConversation(id: string): Conversation | undefined {
  return conversationCache.get(id)
}

export function peekCachedMessages(conversationId: string): ChatMessage[] {
  const messages = messagesByConversation.get(conversationId)
  if (!messages) return []
  return [...messages.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function mapConversationRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    listingId: row.listing_id ?? "",
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    listingName: row.listing_name ?? "Motorcycle",
    listingImage: row.listing_image ?? undefined,
    buyerName: row.buyer_name ?? undefined,
    lastMessage: row.last_message ?? "",
    lastMessageAt: row.last_message_at ?? row.updated_at ?? row.created_at,
    unreadForBuyer: Math.max(0, Number(row.unread_for_buyer) || 0),
    unreadForSeller: Math.max(0, Number(row.unread_for_seller) || 0),
    createdAt: row.created_at,
  }
}

export function mapMessageRow(row: MessageRow, conversation: Conversation): ChatMessage {
  const senderRole = row.sender_id === conversation.buyerId ? "buyer" : "seller"
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderRole,
    message: row.body,
    createdAt: row.created_at,
    read: Boolean(row.read_at),
  }
}

function rememberConversation(conversation: Conversation) {
  conversationCache.set(conversation.id, conversation)
  notifyChatUpdated()
}

function rememberMessage(message: ChatMessage) {
  let bucket = messagesByConversation.get(message.conversationId)
  if (!bucket) {
    bucket = new Map()
    messagesByConversation.set(message.conversationId, bucket)
  }
  bucket.set(message.id, message)
  notifyChatUpdated()
}

function asConversationRow(data: unknown): ConversationRow | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as ConversationRow
}

function asMessageRow(data: unknown): MessageRow | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as MessageRow
}

async function refreshConversation(id: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.from("conversation_inbox").select("*").eq("id", id).maybeSingle()
  if (error) return
  const row = asConversationRow(data)
  if (!row) return
  rememberConversation(mapConversationRow(row))
}

export async function hydrateConversations() {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from("conversation_inbox")
    .select("*")
    .order("last_message_at", { ascending: false })
  if (error) throwUserFacing(error, "Unable to load conversations.")
  conversationCache.clear()
  for (const row of (data as ConversationRow[] | null) ?? []) {
    conversationCache.set(row.id, mapConversationRow(row))
  }
  hydrated = true
  notifyChatUpdated()
}

export async function getMessagesRemote(conversationId: string): Promise<ChatMessage[]> {
  const conversation = conversationCache.get(conversationId) ?? (await refreshConversation(conversationId), conversationCache.get(conversationId))
  if (!conversation) return []
  const client = getSupabaseClient()
  const { data, error } = await client
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
  if (error) throwUserFacing(error, "Unable to load conversations.")
  const bucket = new Map<string, ChatMessage>()
  for (const row of (data as MessageRow[] | null) ?? []) {
    bucket.set(row.id, mapMessageRow(row, conversation))
  }
  messagesByConversation.set(conversationId, bucket)
  notifyChatUpdated()
  return peekCachedMessages(conversationId)
}

export async function ensureMessagesRemote(conversationId: string) {
  return getMessagesRemote(conversationId)
}

type StartConversationResult = { conversation: Conversation; created: boolean }

export async function startConversationRemote(listingId: string): Promise<StartConversationResult> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("start_conversation", { p_listing_id: listingId })
  if (error) throwUserFacing(error, "Unable to load conversations.")
  const payload = data as { created?: boolean; conversation?: ConversationRow } | null
  const row = asConversationRow(payload?.conversation)
  if (!row) throw new Error("Unable to start conversation.")
  const conversation = mapConversationRow(row)
  rememberConversation(conversation)
  await refreshConversation(conversation.id)
  return {
    conversation: conversationCache.get(conversation.id) ?? conversation,
    created: Boolean(payload?.created),
  }
}

export async function sendMessageRemote(conversationId: string, body: string): Promise<ChatMessage> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("send_message", {
    p_conversation_id: conversationId,
    p_body: body,
  })
  if (error) throwUserFacing(error, "Unable to load conversations.")
  const row = asMessageRow(data) ?? (Array.isArray(data) ? asMessageRow(data[0]) : null)
  if (!row) throw new Error("Unable to send this message.")
  let conversation = conversationCache.get(conversationId)
  if (!conversation) {
    await refreshConversation(conversationId)
    conversation = conversationCache.get(conversationId)
  }
  if (!conversation) throw new Error("conversation not found")
  const message = mapMessageRow(row, conversation)
  rememberMessage(message)
  await refreshConversation(conversationId)
  return message
}

export async function markMessagesReadRemote(conversationId: string) {
  const client = getSupabaseClient()
  const { error } = await client.rpc("mark_messages_read", { p_conversation_id: conversationId })
  if (error) throwUserFacing(error, "Unable to load conversations.")
  const { data } = await client.auth.getSession()
  const userId = data.session?.user.id
  const bucket = messagesByConversation.get(conversationId)
  if (bucket && userId) {
    for (const [id, message] of bucket) {
      if (message.senderId !== userId) bucket.set(id, { ...message, read: true })
    }
  }
  await refreshConversation(conversationId)
  notifyChatUpdated()
}

export function subscribeToMessages(conversationId: string) {
  const client = getSupabaseClient()
  const channel = client
    .channel(`chat-messages-${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const row = asMessageRow(payload.new)
        if (!row) return
        const conversation = conversationCache.get(conversationId)
        if (!conversation) {
          void refreshConversation(conversationId).then(() => {
            const next = conversationCache.get(conversationId)
            if (next) rememberMessage(mapMessageRow(row, next))
          })
          return
        }
        rememberMessage(mapMessageRow(row, conversation))
        void refreshConversation(conversationId)
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const row = asMessageRow(payload.new)
        if (!row) return
        const conversation = conversationCache.get(conversationId)
        if (!conversation) return
        rememberMessage(mapMessageRow(row, conversation))
      },
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

export function subscribeToConversationUpdates(userId: string) {
  const client = getSupabaseClient()
  const refetch = () => {
    void hydrateConversations()
  }
  const buyerChannel = client
    .channel(`chat-inbox-buyer-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "conversations", filter: `buyer_id=eq.${userId}` },
      refetch,
    )
    .subscribe()
  const sellerChannel = client
    .channel(`chat-inbox-seller-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "conversations", filter: `seller_id=eq.${userId}` },
      refetch,
    )
    .subscribe()

  return () => {
    void client.removeChannel(buyerChannel)
    void client.removeChannel(sellerChannel)
  }
}
