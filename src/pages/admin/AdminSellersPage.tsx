import { useMemo, useState } from "react"
import type { SellerStatus } from "../../types/seller"
import { approveSeller, listSellerProfiles, rejectSeller } from "../../lib/seller"
import { useSellerLive } from "../../lib/useSellerLive"
import { useAuth } from "../../context/AuthContext"
import { AdminSellerRow } from "../../components/admin/AdminSellerRow"
import { RejectSellerModal } from "../../components/admin/RejectSellerModal"
import { AuthInput } from "../../components/auth/AuthField"
import { Container } from "../../components/layout/Container"
import { cn } from "../../lib/cn"

const FILTERS: { id: "all" | SellerStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
]

export function AdminSellersPage() {
  useSellerLive()
  const { user } = useAuth()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all")
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
      return [seller.businessName, seller.fullName, seller.email, seller.nib, seller.city]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [sellers, filter, query])

  async function handleApprove(id: string) {
    if (!user) return
    setApprovingId(id)
    setMessage("")
    try {
      await approveSeller(id, user.id)
      setMessage("Seller approved.")
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Seller Verification</h1>
          <p className="mt-2 text-navy-muted">Review garage and dealer registrations.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
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
              placeholder="Search business, contact, email, NIB, or city"
            />
          </div>

          {message ? (
            <p className="mt-4 text-sm text-brand" role="status">
              {message}
            </p>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-2xl border border-line">
            {visible.length === 0 ? (
              <p className="px-5 py-8 text-sm text-navy-muted">No sellers match this filter.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="hidden bg-surface md:table-header-group">
                  <tr className="text-xs font-medium uppercase tracking-wide text-navy-muted">
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">NIB</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((seller) => (
                    <AdminSellerRow
                      key={seller.id}
                      seller={seller}
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
