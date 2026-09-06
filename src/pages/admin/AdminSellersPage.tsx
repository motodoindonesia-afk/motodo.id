import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import type { SellerStatus } from "../../types/seller"
import { approveSeller, listSellerProfiles, rejectSeller } from "../../lib/seller"
import { SellerDataGate } from "../../components/seller/SellerDataGate"
import { sellerRowStats } from "../../lib/adminPlatform"
import { useSellerLive } from "../../lib/useSellerLive"
import { useAuth } from "../../context/AuthContext"
import { AdminSellerRow } from "../../components/admin/AdminSellerRow"
import { RejectSellerModal } from "../../components/admin/RejectSellerModal"
import { AuthInput } from "../../components/auth/AuthField"
import { Container } from "../../components/layout/Container"
import { cn } from "../../lib/cn"
import { userFacingMessage } from "../../lib/userFacingError"

const FILTERS: { id: "all" | SellerStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
]

export function AdminSellersPage() {
  return (
    <SellerDataGate>
      <AdminSellersInner />
    </SellerDataGate>
  )
}

function AdminSellersInner() {
  useSellerLive()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get("status")
  const initial = FILTERS.some((item) => item.id === statusParam) ? (statusParam as (typeof FILTERS)[number]["id"]) : "all"
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>(initial)
  const [query, setQuery] = useState("")
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const sellers = listSellerProfiles()
  const rejectTarget = sellers.find((item) => item.id === rejectId) ?? null

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return sellers.filter((seller) => {
      if (filter !== "all" && seller.status !== filter) return false
      if (!needle) return true
      return [seller.businessName, seller.fullName].join(" ").toLowerCase().includes(needle)
    })
  }, [sellers, filter, query])

  async function handleApprove(id: string) {
    if (!user) return
    setApprovingId(id)
    setMessage("")
    try {
      await approveSeller(id, user.id)
      setMessage("Seller approved.")
    } catch (error) {
      setMessage(userFacingMessage(error, "Something went wrong. Please try again."))
    } finally {
      setApprovingId(null)
    }
  }

  function changeFilter(id: (typeof FILTERS)[number]["id"]) {
    setFilter(id)
    if (id === "all") setSearchParams({})
    else setSearchParams({ status: id })
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Sellers</h1>
          <p className="mt-2 text-navy-muted">Review garage and dealer registrations.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => changeFilter(item.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium",
                  filter === item.id ? "bg-brand text-white" : "bg-surface text-navy hover:text-brand",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-4 max-w-md">
            <AuthInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search seller or business name"
            />
          </div>

          {message ? (
            <p className="mt-4 text-sm text-brand" role="status">
              {message}
            </p>
          ) : null}

          <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
            {visible.length === 0 ? (
              <p className="px-5 py-8 text-sm text-navy-muted">No sellers match this filter.</p>
            ) : (
              <table className="w-full min-w-[720px] text-left">
                <thead className="hidden bg-surface md:table-header-group">
                  <tr className="text-xs font-medium uppercase tracking-wide text-navy-muted">
                    <th className="px-4 py-3">Business Name</th>
                    <th className="px-4 py-3">Seller Name</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Active Listings</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((seller) => (
                    <AdminSellerRow
                      key={seller.id}
                      seller={seller}
                      stats={sellerRowStats(seller)}
                      onApprove={handleApprove}
                      onReject={setRejectId}
                      approving={approvingId === seller.id}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Container>

      {rejectTarget ? (
        <RejectSellerModal
          businessName={rejectTarget.businessName}
          onCancel={() => setRejectId(null)}
          onConfirm={async (reason) => {
            if (!user) return
            await rejectSeller(rejectTarget.id, user.id, reason)
            setRejectId(null)
            setMessage("Seller rejected.")
          }}
        />
      ) : null}
    </main>
  )
}
