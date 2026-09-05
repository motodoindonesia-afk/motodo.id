import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import type { ReactNode } from "react"

export function ApprovedSellerRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return <Navigate to="/profile" replace />
  if (profile.status !== "approved") return <Navigate to="/seller/dashboard" replace />
  return children
}
