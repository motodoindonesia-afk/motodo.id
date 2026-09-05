import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getSellerProfile } from "../lib/seller"

export function SellPage() {
  const { user } = useAuth()

  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return <Navigate to="/seller/register" replace />
  if (profile.status !== "approved") return <Navigate to="/seller/dashboard" replace />
  return <Navigate to="/seller/listings/new" replace />
}
