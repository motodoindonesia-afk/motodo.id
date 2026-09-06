import { useState, type FormEvent } from "react"
import { AuthInput, AuthTextarea, Field } from "../auth/AuthField"
import { Button } from "../ui/Button"
import { StarRating } from "./StarRating"
import { ReviewCard } from "./ReviewCard"
import {
  MAX_REVIEW_COMMENT,
  ReviewError,
  createReview,
  getReviewByOrderId,
  hasReviewedOrder,
} from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"
import type { Order } from "../../types/order"
import { useLanguage } from "../../i18n"

export function OrderReviewSection({ order, buyerId }: { order: Order; buyerId: string }) {
  useReviewsLive()
  const { t, tm } = useLanguage()
  const existing = getReviewByOrderId(order.id)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [thanks, setThanks] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (order.status !== "completed") return null

  if (existing) {
    return (
      <section id="review" className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-navy">{t("orders.reviewed")}</h2>
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-navy">{t("orders.reviewed")}</span>
        </div>
        {thanks ? <p className="mt-2 text-sm text-navy">{t("review.thanks")}</p> : null}
        <div className="mt-4">
          <ReviewCard review={existing} />
        </div>
      </section>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    if (hasReviewedOrder(order.id)) {
      setError(t("review.already"))
      return
    }
    setSubmitting(true)
    try {
      await createReview({
        orderId: order.id,
        buyerId,
        rating,
        title,
        comment,
      })
      setThanks(true)
    } catch (err) {
      setError(err instanceof ReviewError || err instanceof Error ? tm(err.message, "review.unable") : t("review.unable"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="review" className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
      <h2 className="text-lg font-bold text-navy">{t("review.rateTitle")}</h2>
      <p className="mt-1 text-sm text-navy-muted">{t("review.rateBody")}</p>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <p className="mb-1.5 text-sm font-medium text-navy">{t("review.rating")}</p>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <Field label={t("review.titleLabel")} htmlFor="review-title" optional>
          <AuthInput id="review-title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label={t("review.comment")} htmlFor="review-comment">
          <AuthTextarea
            id="review-comment"
            value={comment}
            maxLength={MAX_REVIEW_COMMENT}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>
        <p className="text-xs text-navy-muted">{comment.trim().length}/{MAX_REVIEW_COMMENT}</p>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? t("review.submitting") : t("review.submit")}
        </Button>
      </form>
    </section>
  )
}
