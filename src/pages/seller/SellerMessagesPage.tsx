import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { MessagesWorkspace } from "../../components/chat/MessagesWorkspace"

export function SellerMessagesPage() {
  const { user } = useAuth()
  if (!user) return null
  if (!getSellerProfile(user.id)) return <Navigate to="/messages" replace />
  return <MessagesWorkspace role="seller" embedded />
}
