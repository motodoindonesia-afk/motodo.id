import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminNav } from "../../components/admin/AdminNav"
import { AuthInput } from "../../components/auth/AuthField"
import { Container } from "../../components/layout/Container"
import { Button } from "../../components/ui/Button"
import { cn } from "../../lib/cn"
import { listingStockSummary } from "../../lib/inventory"
import { formatIDR } from "../../lib/listingForm"
import { listingStatusLabel } from "../../lib/listings"
import { formatShortDate } from "../../lib/profile"
import { getAllListings, sellerBusinessName } from "../../lib/adminPlatform"
import { useListingsLive } from "../../lib/useListingsLive"
import { useSellerLive } from "../../lib/useSellerLive"
import { listSellerProfiles } from "../../lib/seller"
import type { SellerListingStatus } from "../../types/sellerListing"

const STATUS_FILTERS: { id: "all" | SellerListingStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "active", label: "Active" },
  { id: "sold", label: "Sold" },
]

export function AdminListingsPage() {
  useListingsLive()
  useSellerLive()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get("status")
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]["id"]>(
    STATUS_FILTERS.some((item) => item.id === statusParam) ? (statusParam as SellerListingStatus) : "all",
  )
  const [sellerFilter, setSellerFilter] = useState("all")
  const [query, setQuery] = useState("")
  const listings = getAllListings()
  const sellers = listSellerProfiles()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return listings.filter((listing) => {
      if (status !== "all" && listing.status !== status) return false
      if (sellerFilter !== "all" && listing.sellerId !== sellerFilter) return false
      if (!needle) return true
      const seller = sellerBusinessName(listing.sellerId)
      return [listing.name, listing.brand, listing.model, seller].join(" ").toLowerCase().includes(needle)
    })
  }, [listings, status, sellerFilter, query])

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Listings</h1>
          <p className="mt-2 text-navy-muted">Inspect and moderate motorcycles across the marketplace.</p>
          <AdminNav />

          <div className="mt-6 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium",
                  status === item.id ? "bg-brand text-white" : "bg-surface text-navy hover:text-brand",
                )}
                onClick={() => setStatus(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <AuthInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search motorcycle, brand, model, or seller"
            />
            <label className="grid gap-1 text-sm">
              <span className="sr-only">Seller</span>
              <select
                className="h-11 rounded-lg border border-line bg-white px-3 text-sm text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
                value={sellerFilter}
                onChange={(event) => setSellerFilter(event.target.value)}
              >
                <option value="all">All sellers</option>
                {sellers.map((seller) => (
                  <option key={seller.userId} value={seller.userId}>
                    {seller.businessName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
            {visible.length === 0 ? (
              <p className="px-5 py-8 text-sm text-navy-muted">No listings match this filter.</p>
            ) : (
              <table className="w-full min-w-[720px] text-left">
                <thead className="hidden bg-surface md:table-header-group">
                  <tr className="text-xs font-medium uppercase tracking-wide text-navy-muted">
                    <th className="px-4 py-3">Motorcycle</th>
                    <th className="px-4 py-3">Seller</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((listing) => (
                    <tr key={listing.id} className="border-t border-line">
                      <td className="px-4 py-3 text-sm font-medium text-navy">{listing.name}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{sellerBusinessName(listing.sellerId)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{formatIDR(listing.price)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">
                        {listingStockSummary(listing).available}
                        {listingStockSummary(listing).reserved > 0
                          ? ` (${listingStockSummary(listing).reserved} reserved)`
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{listing.city || listing.location}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{listingStatusLabel(listing.status)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{formatShortDate(listing.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="secondary" onClick={() => navigate(`/admin/listings/${listing.id}`)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Container>
    </main>
  )
}
