import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthInput } from "../../components/auth/AuthField"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { StarRating } from "../../components/reviews/StarRating"
import { cn } from "../../lib/cn"
import {
  getAllAdminReviews,
  reviewBuyerName,
  reviewMotorcycleName,
  sellerBusinessName,
} from "../../lib/adminPlatform"
import { formatReviewMonth } from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { useSellerLive } from "../../lib/useSellerLive"

const FILTERS = [
  { id: "all", label: "All" },
  { id: "5", label: "5 Stars" },
  { id: "4", label: "4 Stars" },
  { id: "3", label: "3 Stars" },
  { id: "2", label: "2 Stars" },
  { id: "1", label: "1 Star" },
] as const

export function AdminReviewsPage() {
  useReviewsLive()
  useSellerLive()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all")
  const [query, setQuery] = useState("")
  const reviews = getAllAdminReviews()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return reviews.filter((review) => {
      if (filter !== "all" && String(review.rating) !== filter) return false
      if (!needle) return true
      return [
        reviewMotorcycleName(review),
        sellerBusinessName(review.sellerId),
        reviewBuyerName(review),
        review.title ?? "",
        review.comment,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [reviews, filter, query])

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Reviews</h1>
          <p className="mt-2 text-navy-muted">Moderate published and hidden reviews. Reviews are never deleted.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium",
                  filter === item.id ? "bg-brand text-white" : "bg-surface text-navy hover:text-brand",
                )}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 max-w-md">
            <AuthInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search motorcycle, seller, or buyer"
            />
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
            {visible.length === 0 ? (
              <p className="px-5 py-8 text-sm text-navy-muted">No reviews match this filter.</p>
            ) : (
              <table className="w-full min-w-[800px] text-left">
                <thead className="bg-surface">
                  <tr className="text-xs font-medium uppercase tracking-wide text-navy-muted">
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Comment</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Seller</th>
                    <th className="px-4 py-3">Motorcycle</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((review) => (
                    <tr key={review.id} className="border-t border-line">
                      <td className="px-4 py-3">
                        <StarRating value={review.rating} readOnly size="sm" />
                      </td>
                      <td className="px-4 py-3 text-sm text-navy">{review.title || "—"}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-sm text-navy-muted">{review.comment}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{reviewBuyerName(review)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{sellerBusinessName(review.sellerId)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{reviewMotorcycleName(review)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-navy">{review.orderId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{formatReviewMonth(review.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="secondary" onClick={() => navigate(`/reviews/${review.id}`)}>
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
