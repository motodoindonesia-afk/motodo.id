import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { SellerDataGate } from "./SellerDataGate"

export function SellerOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return null
  return (
    <SellerDataGate>
      <SellerOnlyCheck>{children}</SellerOnlyCheck>
    </SellerDataGate>
  )
}

function SellerOnlyCheck({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return <Navigate to="/profile" replace />
  return children
}
