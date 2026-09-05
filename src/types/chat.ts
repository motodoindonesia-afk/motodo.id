export type ChatSenderRole = "buyer" | "seller"

export type Conversation = {
  id: string
  listingId: string
  sellerId: string
  buyerId: string
  listingName: string
  listingImage?: string
  lastMessage: string
  lastMessageAt: string
  unreadForBuyer: number
  unreadForSeller: number
  createdAt: string
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  senderRole: ChatSenderRole
  message: string
  createdAt: string
  read: boolean
}

export type ConversationListingContext = {
  name: string
  price: string
  image?: string
  quantity: number
  status: "active" | "sold" | "missing"
}
