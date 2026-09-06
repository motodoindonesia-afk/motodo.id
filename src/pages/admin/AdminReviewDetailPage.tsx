import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ConfirmActionModal } from "../../components/admin/ConfirmActionModal"
import { StarRating } from "../../components/reviews/StarRating"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { reviewBuyerName, reviewMotorcycleName, sellerBusinessName } from "../../lib/adminPlatform"
import { getReviewById, formatReviewMonth, setReviewStatus } from "../../lib/reviews"
import { getSellerProfile } from "../../lib/seller"
import { useReviewsLive } from "../../lib/useReviewsLive"

export function AdminReviewDetailPage() {
  const { reviewId, id } = useParams()
  const reviewIdResolved = reviewId ?? id
  const navigate = useNavigate()
  useReviewsLive()
  const review = reviewIdResolved ? getReviewById(reviewIdResolved) : null
  const [confirmHide, setConfirmHide] = useState(false)
  const [message, setMessage] = useState("")

  if (!review) {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container className="max-w-xl text-center">
          <h1 className="text-2xl font-bold text-navy">Review not found</h1>
          <Button className="mt-6" onClick={() => navigate("/reviews")}>
            Back to reviews
          </Button>
        </Container>
      </main>
    )
  }

  const seller = getSellerProfile(review.sellerId)
  const currentReviewId = review.id

  async function hideReview() {
    setConfirmHide(false)
    await setReviewStatus(currentReviewId, "hidden")
    setMessage("Review hidden from public pages.")
  }

  async function publishReview() {
    await setReviewStatus(currentReviewId, "published")
    setMessage("Review is published again.")
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Admin</h1>
          <p className="mt-6 text-sm">
            <Link to="/reviews" className="font-medium text-brand hover:text-brand-hover">
              ← Reviews
            </Link>
          </p>
          <h2 className="mt-3 text-2xl font-bold text-navy">{review.title || "Customer review"}</h2>
          {message ? (
            <p className="mt-3 text-sm text-brand" role="status">
              {message}
            </p>
          ) : null}

          <section className="mt-8 rounded-2xl border border-line px-5 py-6">
            <StarRating value={review.rating} readOnly />
            {review.title ? <p className="mt-3 font-semibold text-navy">{review.title}</p> : null}
            <p className="mt-2 text-sm leading-relaxed text-navy-muted">“{review.comment}”</p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Buyer</dt>
                <dd className="font-medium text-navy">{reviewBuyerName(review)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Seller</dt>
                <dd className="font-medium text-navy">{sellerBusinessName(review.sellerId)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Motorcycle</dt>
                <dd className="font-medium text-navy">{reviewMotorcycleName(review)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Order ID</dt>
                <dd className="font-mono text-xs text-navy">{review.orderId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Created Date</dt>
                <dd className="font-medium text-navy">{formatReviewMonth(review.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Status</dt>
                <dd className="font-medium capitalize text-navy">{review.status}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/orders/${review.orderId}`} className="text-sm font-medium text-brand hover:text-brand-hover">
                View Order
              </Link>
              <Link to={`/listings/${review.listingId}`} className="text-sm font-medium text-brand hover:text-brand-hover">
                View Motorcycle
              </Link>
              {seller ? (
                <Link to={`/sellers/${seller.id}`} className="text-sm font-medium text-brand hover:text-brand-hover">
                  View Seller
                </Link>
              ) : null}
            </div>
          </section>

          <div className="mt-6">
            {review.status === "published" ? (
              <Button variant="secondary" onClick={() => setConfirmHide(true)}>
                Hide Review
              </Button>
            ) : (
              <Button onClick={publishReview}>Publish Review</Button>
            )}
          </div>
        </div>
      </Container>

      {confirmHide ? (
        <ConfirmActionModal
          title="Hide review"
          description="This review will be hidden from public pages and seller dashboards. It will not be deleted."
          confirmLabel="Hide Review"
          onCancel={() => setConfirmHide(false)}
          onConfirm={hideReview}
        />
      ) : null}
    </main>
  )
}
