import { RatingSummary } from "../../components/reviews/RatingSummary"
import { ReviewCard } from "../../components/reviews/ReviewCard"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { getOrderById } from "../../lib/orders"
import { getRatingBreakdown, getSellerRatingSummary, getSellerReviews } from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { useSellerLive } from "../../lib/useSellerLive"
import { useT } from "../../i18n"

export function SellerReviewsPage() {
  const { user } = useAuth()
  useSellerLive()
  useReviewsLive()
  const t = useT()

  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return null

  const reviews = getSellerReviews(user.id)
  const summary = getSellerRatingSummary(user.id)
  const average = summary.average
  const breakdown = getRatingBreakdown(reviews)

  return (
    <div className="min-w-0">
          <h1 className="text-heading font-semibold tracking-tight text-navy">{t("seller.reviewsTitle")}</h1>
          <p className="mt-1 text-[13px] text-navy-muted">{t("seller.reviewsBody")}</p>

          <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <RatingSummary
              average={average}
              count={summary.count}
              breakdown={reviews.length > 0 ? breakdown : undefined}
              emptyLabel={t("review.noSellerYet")}
            />
          </section>

          {reviews.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showListing
                  listingName={review.listingName ?? getOrderById(review.orderId)?.listingName}
                />
              ))}
            </div>
          ) : null}
    </div>
  )
}
