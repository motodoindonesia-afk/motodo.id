import { ShieldCheck } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { RatingSummary } from "../components/reviews/RatingSummary"
import { ReviewCard } from "../components/reviews/ReviewCard"
import { Container } from "../components/layout/Container"
import {
  getPublicSellerProfile,
  getPublicSellerRatingBreakdown,
  getPublicSellerReviews,
  publicSellerPath,
} from "../lib/sellers"
import { getSellerRatingSummary } from "../lib/reviews"
import { useReviewsLive } from "../lib/useReviewsLive"
import { useSellerLive } from "../lib/useSellerLive"
import { useT } from "../i18n"

export function PublicSellerReviewsPage() {
  const { sellerId = "" } = useParams()
  const t = useT()
  useSellerLive()
  useReviewsLive()

  const profile = getPublicSellerProfile(sellerId)

  if (!profile) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.notFound")}</h1>
          <p className="mt-3 text-navy-muted">{t("seller.notFoundBody")}</p>
          <Link to="/browse" className="mt-8 inline-flex text-sm font-medium text-brand hover:text-brand-hover">
            {t("listing.returnBrowse")}
          </Link>
        </Container>
      </main>
    )
  }

  const storePath = publicSellerPath(profile.userId)
  const approved = profile.status === "approved"
  const reviews = approved ? getPublicSellerReviews(profile.userId) : []
  const summary = approved ? getSellerRatingSummary(profile.userId) : { average: null, count: 0 }
  const average = summary.average
  const breakdown = approved ? getPublicSellerRatingBreakdown(profile.userId) : undefined

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Link to={storePath} className="text-sm font-medium text-brand hover:text-brand-hover">
            {t("seller.backTo", { name: profile.businessName })}
          </Link>
          <div className="mt-5">
            <h1 className="text-3xl font-bold tracking-tight text-navy">{profile.businessName}</h1>
            {approved ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy">
                <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                {t("listing.verifiedSeller")}
              </p>
            ) : null}
          </div>

          {!approved ? (
            <p className="mt-8 rounded-2xl border border-line bg-surface px-5 py-8 text-center text-navy-muted">
              {profile.status === "pending" ? t("seller.underVerification") : t("seller.unavailable")}
            </p>
          ) : (
            <>
              <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6">
                <RatingSummary
                  title={t("seller.customerReviews")}
                  average={average}
                  count={summary.count}
                  breakdown={reviews.length > 0 ? breakdown : undefined}
                  emptyLabel={t("listing.noReviews")}
                />
              </section>
              {reviews.length > 0 ? (
                <div className="mt-6 grid gap-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </Container>
    </main>
  )
}
