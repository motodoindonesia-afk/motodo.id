import { useNavigate } from "react-router-dom"
import type { SellerProfile } from "../../types/seller"
import { formatShortDate } from "../../lib/profile"
import { SellerStatusBadge } from "../seller/SellerStatusBadge"
import { Button } from "../ui/Button"

type Stats = {
  activeListings: number
  orders: number
  rating: string | null
}

type Props = {
  seller: SellerProfile
  stats?: Stats
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  approving?: boolean
}

export function AdminSellerRow({ seller, stats, onApprove, onReject, approving }: Props) {
  const navigate = useNavigate()
  const pending = seller.status === "pending"

  function actions() {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigate(`/admin/sellers/${seller.id}`)}>
          Review
        </Button>
        {pending && onApprove ? (
          <Button onClick={() => onApprove(seller.id)} disabled={approving}>
            Approve
          </Button>
        ) : null}
        {pending && onReject ? (
          <Button
            variant="secondary"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => onReject(seller.id)}
          >
            Reject
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <tr className="hidden border-t border-line md:table-row">
        <td className="px-4 py-3 text-sm font-medium text-navy">{seller.businessName}</td>
        <td className="px-4 py-3 text-sm text-navy-muted">{seller.fullName}</td>
        <td className="px-4 py-3 text-sm text-navy-muted">{seller.city}</td>
        <td className="px-4 py-3">
          <SellerStatusBadge status={seller.status} />
        </td>
        <td className="px-4 py-3 text-sm text-navy-muted">{stats?.activeListings ?? "—"}</td>
        <td className="px-4 py-3 text-sm text-navy-muted">{stats?.orders ?? "—"}</td>
        <td className="px-4 py-3 text-sm text-navy-muted">{stats?.rating ?? "—"}</td>
        <td className="px-4 py-3 text-sm text-navy-muted">{formatShortDate(seller.createdAt)}</td>
        <td className="px-4 py-3">{actions()}</td>
      </tr>
      <tr className="md:hidden">
        <td className="block border-t border-line px-4 py-4">
          <p className="font-semibold text-navy">{seller.businessName}</p>
          <p className="mt-1 text-sm text-navy-muted">{seller.fullName}</p>
          <p className="mt-1 text-sm text-navy-muted">{seller.city}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SellerStatusBadge status={seller.status} />
            <span className="text-xs text-navy-muted">{formatShortDate(seller.createdAt)}</span>
          </div>
          <p className="mt-2 text-xs text-navy-muted">
            {stats?.activeListings ?? 0} active listings · {stats?.orders ?? 0} orders
            {stats?.rating ? ` · ${stats.rating}` : ""}
          </p>
          <div className="mt-3">{actions()}</div>
        </td>
      </tr>
    </>
  )
}
