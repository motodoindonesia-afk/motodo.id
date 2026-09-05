import type { ChatMessage, Conversation, ConversationListingContext } from "../types/chat"
import type { MotorcycleListing as CatalogListing } from "../types/marketplace"
import { getUserById } from "./auth"
import { formatAvailableQuantity, normalizeQuantity } from "./listingForm"
import { getListingById, getPublicListingById, toCatalogListing } from "./listings"
import { getSellerProfile } from "./seller"

export const CONVERSATIONS_STORAGE_KEY = "motodo_conversations"
export const CHAT_MESSAGES_STORAGE_KEY = "motodo_chat_messages"
export const CHAT_UPDATED_EVENT = "motodo:chat-updated"

export const INITIAL_BUYER_MESSAGE = "Hi, I'm interested in this motorcycle. Is it still available?"

function notifyChatUpdated() {
  window.dispatchEvent(new Event(CHAT_UPDATED_EVENT))
}

function isRole(value: unknown): value is ChatMessage["senderRole"] {
  return value === "buyer" || value === "seller"
}

function normalizeConversation(value: Partial<Conversation>): Conversation | null {
  if (!value.id || !value.listingId || !value.sellerId || !value.buyerId) return null
  if (typeof value.listingName !== "string" || typeof value.lastMessage !== "string") return null
  if (typeof value.lastMessageAt !== "string" || typeof value.createdAt !== "string") return null
  if (typeof value.unreadForBuyer !== "number" || typeof value.unreadForSeller !== "number") return null
  return {
    id: value.id,
    listingId: value.listingId,
    sellerId: value.sellerId,
    buyerId: value.buyerId,
    listingName: value.listingName,
    listingImage: typeof value.listingImage === "string" ? value.listingImage : undefined,
    lastMessage: value.lastMessage,
    lastMessageAt: value.lastMessageAt,
    unreadForBuyer: Math.max(0, Math.round(value.unreadForBuyer)),
    unreadForSeller: Math.max(0, Math.round(value.unreadForSeller)),
    createdAt: value.createdAt,
  }
}

function normalizeMessage(value: Partial<ChatMessage>): ChatMessage | null {
  if (!value.id || !value.conversationId || !value.senderId) return null
  if (!isRole(value.senderRole) || typeof value.message !== "string") return null
  if (typeof value.createdAt !== "string") return null
  return {
    id: value.id,
    conversationId: value.conversationId,
    senderId: value.senderId,
    senderRole: value.senderRole,
    message: value.message,
    createdAt: value.createdAt,
    read: Boolean(value.read),
  }
}

function readConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<Conversation>[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const conversation = normalizeConversation(item)
      return conversation ? [conversation] : []
    })
  } catch {
    return []
  }
}

function writeConversations(conversations: Conversation[]) {
  localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations))
  notifyChatUpdated()
}

function readMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<ChatMessage>[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const message = normalizeMessage(item)
      return message ? [message] : []
    })
  } catch {
    return []
  }
}

function writeMessages(messages: ChatMessage[]) {
  localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  notifyChatUpdated()
}

function sortByLatest(conversations: Conversation[]) {
  return [...conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
}

export function getConversations(): Conversation[] {
  return sortByLatest(readConversations())
}

export function getConversation(id: string): Conversation | null {
  return readConversations().find((item) => item.id === id) ?? null
}

export function getBuyerConversations(buyerId: string): Conversation[] {
  return getConversations().filter((item) => item.buyerId === buyerId)
}

export function getSellerConversations(sellerId: string): Conversation[] {
  return getConversations().filter((item) => item.sellerId === sellerId)
}

export function findConversation(listingId: string, buyerId: string, sellerId: string): Conversation | null {
  return (
    readConversations().find(
      (item) => item.listingId === listingId && item.buyerId === buyerId && item.sellerId === sellerId,
    ) ?? null
  )
}

export function canAccessConversation(conversation: Conversation | null, userId: string, role: "buyer" | "seller") {
  if (!conversation) return false
  return role === "buyer" ? conversation.buyerId === userId : conversation.sellerId === userId
}

export function getMessages(conversationId: string): ChatMessage[] {
  return readMessages()
    .filter((item) => item.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function getUnreadCount(userId: string, role: "buyer" | "seller") {
  const conversations = role === "buyer" ? getBuyerConversations(userId) : getSellerConversations(userId)
  return conversations.reduce((total, item) => total + (role === "buyer" ? item.unreadForBuyer : item.unreadForSeller), 0)
}

function catalogFromStored(listingId: string): CatalogListing | undefined {
  const stored = getListingById(listingId)
  if (!stored || stored.status === "draft") return undefined
  return toCatalogListing(stored)
}

export function getConversationListingContext(conversation: Conversation): ConversationListingContext {
  const live = getPublicListingById(conversation.listingId) ?? catalogFromStored(conversation.listingId)
  if (!live) {
    return {
      name: conversation.listingName,
      price: "",
      image: conversation.listingImage,
      quantity: 1,
      status: "missing",
    }
  }
  return {
    name: live.name,
    price: live.price,
    image: live.image || conversation.listingImage,
    quantity: normalizeQuantity(live.quantity),
    status: live.status === "sold" ? "sold" : "active",
  }
}

export function getConversationCounterpartyName(conversation: Conversation, viewerId: string) {
  if (viewerId === conversation.buyerId) {
    return (
      getSellerProfile(conversation.sellerId)?.businessName ??
      getPublicListingById(conversation.listingId)?.seller.name ??
      catalogFromStored(conversation.listingId)?.seller.name ??
      "Seller"
    )
  }
  return getUserById(conversation.buyerId)?.fullName ?? "Buyer"
}

export function formatAvailableForChat(quantity?: number) {
  return formatAvailableQuantity(quantity)
}

export function formatChatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (sameDay) {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export function formatMessageTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function appendMessage(conversation: Conversation, input: Omit<ChatMessage, "id" | "createdAt">) {
  const now = new Date().toISOString()
  const message: ChatMessage = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
  }
  const nextConversation: Conversation = {
    ...conversation,
    lastMessage: message.message,
    lastMessageAt: now,
    unreadForBuyer: input.senderRole === "seller" ? conversation.unreadForBuyer + 1 : conversation.unreadForBuyer,
    unreadForSeller: input.senderRole === "buyer" ? conversation.unreadForSeller + 1 : conversation.unreadForSeller,
  }
  writeMessages([...readMessages(), message])
  writeConversations(readConversations().map((item) => (item.id === conversation.id ? nextConversation : item)))
  return { conversation: nextConversation, message }
}

export function createConversation(listing: CatalogListing, buyerId: string): Conversation {
  const existing = findConversation(listing.id, buyerId, listing.sellerId)
  if (existing) return existing
  const now = new Date().toISOString()
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    listingId: listing.id,
    sellerId: listing.sellerId,
    buyerId,
    listingName: listing.name,
    listingImage: listing.image || undefined,
    lastMessage: "",
    lastMessageAt: now,
    unreadForBuyer: 0,
    unreadForSeller: 0,
    createdAt: now,
  }
  writeConversations([conversation, ...readConversations()])
  return conversation
}

export function startBuyerConversation(
  listing: CatalogListing,
  buyerId: string,
): { conversation: Conversation; created: boolean } | { error: "self" | "not_found" } {
  const live = getPublicListingById(listing.id) ?? catalogFromStored(listing.id)
  if (!live) return { error: "not_found" }
  if (live.sellerId === buyerId) return { error: "self" }
  const existing = findConversation(live.id, buyerId, live.sellerId)
  if (existing) return { conversation: existing, created: false }
  const conversation = createConversation(live, buyerId)
  appendMessage(conversation, {
    conversationId: conversation.id,
    senderId: buyerId,
    senderRole: "buyer",
    message: INITIAL_BUYER_MESSAGE,
    read: false,
  })
  return { conversation: getConversation(conversation.id) ?? conversation, created: true }
}

export function sendMessage(conversationId: string, senderId: string, text: string): ChatMessage | null {
  const message = text.trim()
  if (!message) return null
  const conversation = getConversation(conversationId)
  if (!conversation) return null
  const senderRole =
    conversation.buyerId === senderId ? "buyer" : conversation.sellerId === senderId ? "seller" : null
  if (!senderRole) return null
  return appendMessage(conversation, {
    conversationId,
    senderId,
    senderRole,
    message,
    read: false,
  }).message
}

export function markConversationAsRead(conversationId: string, userId: string) {
  const conversation = getConversation(conversationId)
  if (!conversation) return
  const asBuyer = conversation.buyerId === userId
  const asSeller = conversation.sellerId === userId
  if (!asBuyer && !asSeller) return

  const incomingRole = asBuyer ? "seller" : "buyer"
  const unreadCount = asBuyer ? conversation.unreadForBuyer : conversation.unreadForSeller
  const incoming = readMessages().filter(
    (item) => item.conversationId === conversationId && item.senderRole === incomingRole && !item.read,
  )
  if (unreadCount === 0 && incoming.length === 0) return

  writeMessages(
    readMessages().map((item) => {
      if (item.conversationId !== conversationId || item.senderRole !== incomingRole) return item
      return { ...item, read: true }
    }),
  )
  writeConversations(
    readConversations().map((item) => {
      if (item.id !== conversationId) return item
      return {
        ...item,
        unreadForBuyer: asBuyer ? 0 : item.unreadForBuyer,
        unreadForSeller: asSeller ? 0 : item.unreadForSeller,
      }
    }),
  )
}

export function subscribeChatUpdates(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === CONVERSATIONS_STORAGE_KEY || event.key === CHAT_MESSAGES_STORAGE_KEY || event.key === null) {
      onChange()
    }
  }
  window.addEventListener(CHAT_UPDATED_EVENT, onChange)
  window.addEventListener("storage", handleStorage)
  return () => {
    window.removeEventListener(CHAT_UPDATED_EVENT, onChange)
    window.removeEventListener("storage", handleStorage)
  }
}

/** Dev-only helper. Not used by the app UI. Call from the console while developing. */
export function seedDevConversations(buyerId: string, sellerId: string, listing: CatalogListing) {
  if (buyerId === sellerId) return null
  const started = startBuyerConversation({ ...listing, sellerId }, buyerId)
  if ("error" in started) return started
  sendMessage(started.conversation.id, sellerId, "Yes, it is still available. Would you like to visit the showroom?")
  return started.conversation.id
}
