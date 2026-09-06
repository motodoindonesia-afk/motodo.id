import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getSellerProfile } from "../lib/seller"
import { SellerDataGate } from "../components/seller/SellerDataGate"

export function SellPage() {
  const { user, loading } = useAuth()

  if (loading || !user) return null
  return (
    <SellerDataGate>
      <SellPageInner />
    </SellerDataGate>
  )
}

function SellPageInner() {
  const { user } = useAuth()
  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return <Navigate to="/seller/register" replace />
  if (profile.status !== "approved") return <Navigate to="/seller/dashboard" replace />
  return <Navigate to="/seller/listings/new" replace />
}
