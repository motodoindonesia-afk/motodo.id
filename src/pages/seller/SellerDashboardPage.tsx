import { Link, useNavigate } from "react-router-dom"
import {
  MessageCircle,
  Package,
  Plus,
  ShoppingBag,
  Store,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { OrderStatusBadge } from "../../components/orders/OrderStatusBadge"
import { Button } from "../../components/ui/Button"
import { ViewAllLink } from "../../components/ui/ViewAllLink"
import { formatIDR } from "../../lib/listingForm"
import { getListingsBySeller, getSellerListingCounts } from "../../lib/listings"
import { getSellerProfile } from "../../lib/seller"
import { publicSellerPath } from "../../lib/sellers"
import { formatOrderDate, getSellerOrderCounts, getSellerOrders, getSellerRevenueSummary, orderPublicRef } from "../../lib/orders"
import { getUnreadCount } from "../../lib/chat"
import { getSellerRatingSummary } from "../../lib/reviews"
import { useChatLive } from "../../lib/useChatLive"
import { useListingsLive } from "../../lib/useListingsLive"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useSellerLive } from "../../lib/useSellerLive"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { CompactRating } from "../../components/reviews/CompactRating"
import { useLanguage } from "../../i18n"
import { cn } from "../../lib/cn"

export function SellerDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  useReviewsLive()
  useListingsLive()
  useChatLive()
  useOrdersLive()
  const { t } = useLanguage()

  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return null

  const approved = profile.status === "approved"
  const sellerId = user.id
  const listingCounts = getSellerListingCounts(sellerId)
  const listings = getListingsBySeller(sellerId).slice(0, 4)
  const orderCounts = getSellerOrderCounts(sellerId)
  const recentOrders = getSellerOrders(sellerId).slice(0, 3)
  const unread = getUnreadCount(sellerId, "seller")
  const rating = getSellerRatingSummary(sellerId)
  const allTime = getSellerRevenueSummary(sellerId, "all")
  const thisMonth = getSellerRevenueSummary(sellerId, "month")
  const hasPerformance = allTime.countedCount > 0 || thisMonth.countedCount > 0

  return (
    <div className="space-y-3">
        {profile.status !== "approved" ? (
          <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
            {profile.status === "pending" ? (
              <>
                <p className="text-[13px] font-semibold text-navy">{t("seller.pendingReview")}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-navy-muted">{t("seller.pendingCannot")}</p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-navy">{t("seller.rejectedTitle")}</p>
                {profile.rejectionReason ? (
                  <p className="mt-1 text-[12px] leading-relaxed text-navy">{profile.rejectionReason}</p>
                ) : null}
                <Button className="mt-3 h-10 px-4 py-2 text-[13px]" onClick={() => navigate("/seller/register")}>
                  {t("profile.editRegistration")}
                </Button>
              </>
            )}
          </section>
        ) : null}

        <section className="rounded-2xl border border-line bg-white p-4 shadow-card min-[1024px]:p-5">
          <h1 className="text-heading font-semibold tracking-tight text-navy">{t("seller.welcome")}</h1>
          <p className="mt-1 text-[13px] text-navy-muted">{t("seller.welcomeBody")}</p>
          <p className="mt-2 truncate text-ui font-medium text-navy">{profile.businessName}</p>
        </section>

        <section className="grid grid-cols-2 gap-2 min-[1024px]:grid-cols-5 min-[1024px]:gap-2.5">
          <ActionCard
            icon={Plus}
            label={t("seller.addMotor")}
            disabled={!approved}
            onClick={() => navigate("/seller/listings/new")}
          />
          <ActionCard
            icon={Package}
            label={t("seller.manageProducts")}
            disabled={!approved}
            onClick={() => navigate("/seller/listings")}
          />
          <ActionCard icon={ShoppingBag} label={t("seller.viewOrders")} onClick={() => navigate("/seller/orders")} />
          <ActionCard icon={MessageCircle} label={t("seller.openMessages")} onClick={() => navigate("/seller/messages")} />
          <ActionCard
            icon={Store}
            label={t("seller.visitStore")}
            disabled={!approved}
            onClick={() => navigate(publicSellerPath(user.id))}
            className="col-span-2 min-[1024px]:col-span-1"
          />
        </section>
        {!approved ? <p className="text-meta text-navy-muted">{t("seller.unlockHint")}</p> : null}

        <section>
          <h2 className="mb-2 text-ui font-semibold tracking-wide text-navy-muted uppercase">{t("seller.importantToday")}</h2>
          <div className="grid grid-cols-2 gap-2 min-[1024px]:grid-cols-4">
            <MetricCard to="/seller/orders" label={t("seller.newOrders")} value={orderCounts.pending} />
            <MetricCard to="/seller/messages" label={t("seller.unreadMessages")} value={unread} />
            <MetricCard to={approved ? "/seller/listings" : undefined} label={t("seller.activeProducts")} value={listingCounts.active} />
            <MetricCard to="/seller/reviews" label={t("seller.reviewsMetric")} value={rating.count} />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-section font-semibold text-navy">{t("seller.myProducts")}</h2>
            {approved && listings.length > 0 ? (
              <ViewAllLink href="/seller/listings">{t("seller.manageListings")}</ViewAllLink>
            ) : null}
          </div>
          {listings.length === 0 ? (
            <div className="mt-3 py-3 text-center">
              <p className="text-ui font-medium text-navy">{t("seller.noMotors")}</p>
              <p className="mt-1 text-[12px] text-navy-muted">{t("seller.addFirstHint")}</p>
              {approved ? (
                <Button className="mt-3 h-10 px-4 py-2 text-[13px]" onClick={() => navigate("/seller/listings/new")}>
                  {t("seller.addMotor")}
                </Button>
              ) : (
                <p className="mt-2 text-[12px] text-navy-muted">{t("seller.listingAfterApprove")}</p>
              )}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <Link
                    to={approved ? `/seller/listings/${listing.id}` : "/seller/dashboard"}
                    className="flex gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-surface sm:size-16">
                      {listing.images[0] ? (
                        <img src={listing.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-ui font-medium text-navy">{listing.name || t("seller.untitled")}</span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-meta font-medium text-navy">
                          {listing.status === "active"
                            ? t("seller.statusActive")
                            : listing.status === "sold"
                              ? t("seller.statusSold")
                              : t("seller.statusDraft")}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-ui font-semibold text-brand">{formatIDR(listing.price)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-section font-semibold text-navy">{t("seller.recentOrders")}</h2>
            {recentOrders.length > 0 ? <ViewAllLink href="/seller/orders">{t("seller.viewAllOrders")}</ViewAllLink> : null}
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-3 py-3 text-center text-[13px] text-navy-muted">{t("seller.noOrdersYet")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/seller/orders/${orderPublicRef(order)}`}
                    className="flex gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-ui font-medium text-navy">{order.listingName}</span>
                        <OrderStatusBadge status={order.status} />
                      </span>
                      <span className="mt-0.5 block text-meta text-navy-muted">{orderPublicRef(order)}</span>
                      <span className="mt-0.5 block text-meta text-navy-muted">{formatOrderDate(order.createdAt)}</span>
                    </span>
                    <span className="shrink-0 text-ui font-semibold text-navy">{formatIDR(order.buyerTotal)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <h2 className="text-section font-semibold text-navy">{t("seller.myStore")}</h2>
          <p className="mt-2 text-[13px] font-semibold text-navy">{profile.businessName}</p>
          {profile.city ? <p className="mt-0.5 text-[12px] text-navy-muted">{profile.city}</p> : null}
          <p className="mt-1 text-[12px] text-navy-muted">{t("seller.listingCount", { count: listingCounts.total })}</p>
          {rating.count > 0 ? (
            <div className="mt-2">
              <CompactRating average={rating.average} count={rating.count} emptyLabel="" />
            </div>
          ) : null}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {approved ? (
              <Button className="h-10 px-4 py-2 text-[13px]" onClick={() => navigate(publicSellerPath(user.id))}>
                {t("seller.visitStore")}
              </Button>
            ) : (
              <p className="text-meta text-navy-muted">{t("seller.storeNotPublic")}</p>
            )}
            <Button variant="secondary" className="h-10 px-4 py-2 text-[13px]" onClick={() => navigate("/seller/profile/edit")}>
              {t("seller.editStoreProfile")}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <h2 className="text-section font-semibold text-navy">{t("seller.storePerformance")}</h2>
          {hasPerformance ? (
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-meta text-navy-muted">{t("seller.thisMonth")}</dt>
                <dd className="mt-0.5 text-section font-semibold text-navy">{formatIDR(thisMonth.net)}</dd>
              </div>
              <div>
                <dt className="text-meta text-navy-muted">{t("seller.allTimeShort")}</dt>
                <dd className="mt-0.5 text-section font-semibold text-navy">{formatIDR(allTime.net)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-[12px] leading-relaxed text-navy-muted">{t("seller.performanceEmpty")}</p>
          )}
        </section>
      </div>
  )
}

function ActionCard({
  icon: Icon,
  label,
  onClick,
  disabled,
  className,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-[72px] flex-col justify-between rounded-xl border border-line bg-white p-2.5 text-left shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 min-[1024px]:min-h-[80px] min-[1024px]:p-3",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="text-ui font-medium text-navy">{label}</span>
    </button>
  )
}

function MetricCard({ to, label, value }: { to?: string; label: string; value: number }) {
  const body = (
    <>
      <span className="block text-meta text-navy-muted">{label}</span>
      <span className="mt-1 block text-heading font-semibold text-navy">{value}</span>
    </>
  )
  const className =
    "block rounded-xl border border-line bg-white p-3 shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"

  if (!to) {
    return <div className={className}>{body}</div>
  }

  return (
    <Link to={to} className={className}>
      {body}
    </Link>
  )
}
