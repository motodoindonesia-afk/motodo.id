import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { SellerNav } from "../../components/seller/SellerNav"
import { SellerStatusBadge } from "../../components/seller/SellerStatusBadge"
import { OrderStatusBadge } from "../../components/orders/OrderStatusBadge"
import { UnreadBadge } from "../../components/chat/UnreadBadge"
import { Button } from "../../components/ui/Button"
import { ViewAllLink } from "../../components/ui/ViewAllLink"
import { Container } from "../../components/layout/Container"
import { listingStockSummary } from "../../lib/inventory"
import { formatIDR } from "../../lib/listingForm"
import {
  getListingsBySeller,
  getSellerAvailableUnits,
  getSellerListingCounts,
  getSellerLowInventoryListings,
  getSellerSoldOutListings,
} from "../../lib/listings"
import { getSellerProfile } from "../../lib/seller"
import {
  formatOrderDate,
  getSellerOrderCounts,
  getSellerOrders,
  getSellerRevenueSummary,
} from "../../lib/orders"
import { formatChatTime, getConversationCounterpartyName, getSellerConversations } from "../../lib/chat"
import { useChatLive } from "../../lib/useChatLive"
import { useListingsLive } from "../../lib/useListingsLive"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useSellerLive } from "../../lib/useSellerLive"
import { getSellerRatingSummary } from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { CompactRating } from "../../components/reviews/CompactRating"
import { useLanguage } from "../../i18n"

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
  const listings = getListingsBySeller(sellerId).slice(0, 5)
  const availableUnits = getSellerAvailableUnits(sellerId)
  const lowInventory = getSellerLowInventoryListings(sellerId)
  const soldOut = getSellerSoldOutListings(sellerId)
  const orderCounts = getSellerOrderCounts(sellerId)
  const recentOrders = getSellerOrders(sellerId).slice(0, 5)
  const allTime = getSellerRevenueSummary(sellerId, "all")
  const thisMonth = getSellerRevenueSummary(sellerId, "month")
  const conversations = getSellerConversations(sellerId).slice(0, 5)
  const unread = conversations.reduce((total, item) => total + item.unreadForSeller, 0)

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">{t("nav.sellerDashboard")}</h1>
            <SellerStatusBadge
              status={profile.status}
              label={approved ? t("listing.verifiedSeller") : undefined}
            />
          </div>
          <SellerNav approved={approved} />

          <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6" aria-labelledby="verification-heading">
            <h2 id="verification-heading" className="text-lg font-bold text-navy">
              {t("seller.verification")}
            </h2>
            {profile.status === "pending" ? (
              <>
                <p className="mt-3 font-medium text-navy">{t("seller.pendingReview")}</p>
                <p className="mt-2 text-sm leading-relaxed text-navy-muted">
                  {t("seller.pendingBody")}
                </p>
                <p className="mt-3 text-sm text-navy-muted">
                  {t("seller.pendingCannot")}
                </p>
              </>
            ) : null}
            {profile.status === "rejected" ? (
              <>
                <p className="mt-3 font-medium text-navy">{t("seller.rejectedTitle")}</p>
                {profile.rejectionReason ? (
                  <p className="mt-2 text-sm leading-relaxed text-navy">{profile.rejectionReason}</p>
                ) : null}
                <Button className="mt-4" onClick={() => navigate("/seller/register")}>
                  {t("profile.editRegistration")}
                </Button>
              </>
            ) : null}
            {approved ? (
              <p className="mt-3 font-medium text-navy">{t("seller.verifiedAccount")}</p>
            ) : null}
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("listing.sellerRating")}</h2>
            <div className="mt-3">
              <CompactRating
                average={getSellerRatingSummary(sellerId).average}
                count={getSellerRatingSummary(sellerId).count}
                emptyLabel={t("review.noSellerYet")}
              />
            </div>
            <Button className="mt-4" variant="secondary" onClick={() => navigate("/seller/reviews")}>
              {t("seller.viewAllReviews")}
            </Button>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t("seller.activeListings")} value={listingCounts.active} />
            <StatCard label={t("seller.draftListings")} value={listingCounts.draft} />
            <StatCard label={t("seller.soldListings")} value={listingCounts.sold} />
            <StatCard label={t("seller.totalOrders")} value={orderCounts.total} />
          </section>

          <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t("seller.pendingOrders")} value={orderCounts.pending} />
            <StatCard label={t("seller.confirmedOrders")} value={orderCounts.confirmed} />
            <StatCard label={t("seller.completedOrders")} value={orderCounts.completed} />
            <StatCard label={t("seller.cancelledOrders")} value={orderCounts.cancelled} />
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("seller.transactionSummary")}</h2>
            <p className="mt-1 text-sm text-navy-muted">{t("seller.allTime")}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <MoneyRow label={t("seller.gross")} value={formatIDR(allTime.gross)} />
              <MoneyRow label={t("seller.fee")} value={`-${formatIDR(allTime.fee)}`} />
              <MoneyRow label={t("seller.net")} value={formatIDR(allTime.net)} strong />
            </dl>
            <p className="mt-3 text-xs text-navy-muted">
              {t("seller.feeNote")}
            </p>
            {allTime.pendingCount > 0 ? (
              <p className="mt-3 text-sm text-navy-muted">
                {t("seller.pendingRevenue", { count: allTime.pendingCount, amount: formatIDR(allTime.pendingValue) })}
              </p>
            ) : null}
            <div className="mt-5 border-t border-line pt-5">
              <p className="text-sm font-semibold text-navy">{t("seller.thisMonth")}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <MoneyRow label={t("seller.gross")} value={formatIDR(thisMonth.gross)} />
                <MoneyRow label={t("seller.fee")} value={`-${formatIDR(thisMonth.fee)}`} />
                <MoneyRow label={t("seller.net")} value={formatIDR(thisMonth.net)} />
              </dl>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-navy">{t("seller.recentOrders")}</h2>
              <ViewAllLink href="/seller/orders">{t("seller.viewAllOrders")}</ViewAllLink>
            </div>
            {recentOrders.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-navy-muted">{t("orders.empty")}</p>
                <Button className="mt-4" onClick={() => navigate(approved ? "/seller/listings" : "/seller/profile")}>
                  {t("chat.viewListings")}
                </Button>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/seller/orders/${order.id}`}
                      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy">{order.id}</p>
                        <p className="mt-1 truncate text-sm text-navy">{order.listingName}</p>
                        <p className="mt-1 text-xs text-navy-muted">
                          {order.buyerName || t("orders.buyer")} · {t("orders.quantity", { count: order.quantity })} ·{" "}
                          {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <p className="text-sm font-semibold text-navy">{formatIDR(order.buyerTotal)}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-navy">{t("seller.recentMessages")}</h2>
                <UnreadBadge count={unread} />
              </div>
              <ViewAllLink href="/seller/messages">{t("seller.viewAllMessages")}</ViewAllLink>
            </div>
            {conversations.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-navy-muted">{t("chat.emptySeller")}</p>
                <Button className="mt-4" onClick={() => navigate("/seller/messages")}>
                  {t("seller.messages")}
                </Button>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      to={`/seller/messages/${conversation.id}`}
                      className="flex items-start justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy">
                          {getConversationCounterpartyName(conversation, sellerId)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-navy-muted">{conversation.listingName}</p>
                        <p className="mt-1 truncate text-sm text-navy-muted">
                          {conversation.lastMessage || t("chat.noMessagesYet")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="text-xs text-navy-muted">{formatChatTime(conversation.lastMessageAt)}</p>
                        <UnreadBadge count={conversation.unreadForSeller} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-navy">{t("seller.yourListings")}</h2>
              <div className="flex flex-wrap gap-3">
                {approved ? (
                  <>
                    <ViewAllLink href="/seller/listings">{t("seller.manageListings")}</ViewAllLink>
                    <Button onClick={() => navigate("/seller/listings/new")}>{t("profile.addMotorcycle")}</Button>
                  </>
                ) : null}
              </div>
            </div>
            {listings.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-navy-muted">{t("seller.noListed")}</p>
                {approved ? (
                  <Button className="mt-4" onClick={() => navigate("/seller/listings/new")}>
                    {t("seller.addFirst")}
                  </Button>
                ) : (
                  <p className="mt-2 text-sm text-navy-muted">{t("seller.listingAfterApprove")}</p>
                )}
              </div>
            ) : (
              <ul className="mt-4 grid gap-4">
                {listings.map((listing) => (
                  <li key={listing.id} className="flex flex-col gap-3 rounded-xl border border-line p-3 sm:flex-row sm:items-center">
                    <div className="h-28 w-full overflow-hidden rounded-lg bg-surface sm:h-20 sm:w-28 sm:shrink-0">
                      {listing.images[0] ? (
                        <img src={listing.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy">{listing.name || t("seller.untitled")}</p>
                      <p className="mt-1 text-sm font-medium text-brand">{formatIDR(listing.price)}</p>
                      <p className="mt-1 text-xs text-navy-muted">
                        {(() => {
                          const stock = listingStockSummary(listing)
                          if (stock.available <= 0 || listing.status === "sold") return t("listing.soldOut")
                          return `${t("seller.availableCount", { count: stock.available })}${stock.reserved > 0 ? ` · ${t("seller.reserved", { count: stock.reserved })}` : ""}`
                        })()}{" "}
                        · {listing.status === "active" ? t("seller.statusActive") : listing.status === "sold" ? t("seller.statusSold") : t("seller.statusDraft")}
                      </p>
                    </div>
                    {approved ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}`)}>
                          {t("seller.view")}
                        </Button>
                        <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
                          {t("common.edit")}
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">{t("seller.inventory")}</h2>
              <p className="mt-3 text-2xl font-bold text-navy">{t("seller.unitsAvailable", { count: availableUnits })}</p>
              <p className="mt-2 text-sm text-navy-muted">{t("seller.purchasableHint")}</p>
            </div>
            <div className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">{t("seller.lowInventory")}</h2>
              {lowInventory.length === 0 ? (
                <p className="mt-3 text-sm text-navy-muted">{t("seller.noLow")}</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {lowInventory.map((listing) => (
                    <li key={listing.id} className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-navy">{listing.name}</p>
                        <p className="text-xs text-navy-muted">
                          {listingStockSummary(listing).available === 1
                            ? t("seller.remainingOne")
                            : t("seller.remainingMany", { count: listingStockSummary(listing).available })}{" "}
                          · {formatIDR(listing.price)}
                        </p>
                      </div>
                      {approved ? (
                        <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
                          {t("seller.editListing")}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {soldOut.length > 0 ? (
            <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">{t("listing.soldOut")}</h2>
              <ul className="mt-3 space-y-2">
                {soldOut.slice(0, 5).map((listing) => (
                  <li key={listing.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-navy">{listing.name}</span>
                    <span className="text-navy-muted">{t("listing.soldOut")}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("seller.quickActions")}</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button disabled={!approved} onClick={() => navigate("/seller/listings/new")}>
                {t("seller.addMotorcyclePlus")}
              </Button>
              <Button variant="secondary" disabled={!approved} onClick={() => navigate("/seller/listings")}>
                {t("seller.manageListings")}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/seller/orders")}>
                {t("seller.orders")}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/seller/messages")}>
                {t("seller.messages")}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/seller/profile/edit")}>
                {t("seller.editProfile")}
              </Button>
            </div>
            {!approved ? (
              <p className="mt-3 text-sm text-navy-muted">
                {t("seller.unlockHint")}
              </p>
            ) : null}
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("seller.profile")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <MoneyRow label={t("seller.businessName")} value={profile.businessName} />
              <MoneyRow label={t("seller.sellerName")} value={profile.fullName} />
              <MoneyRow label={t("orders.city")} value={profile.city} />
              <MoneyRow label="NIB" value={profile.nib} />
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">{t("seller.verificationStatus")}</dt>
                <dd>
                  <SellerStatusBadge status={profile.status} label={approved ? t("listing.verifiedSeller") : undefined} />
                </dd>
              </div>
            </dl>
            <Button className="mt-5" onClick={() => navigate("/seller/profile/edit")}>
              {t("seller.editProfile")}
            </Button>
          </section>
        </div>
      </Container>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="text-sm text-navy-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
    </div>
  )
}

function MoneyRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-semibold text-navy" : "text-navy-muted"}>{label}</dt>
      <dd className={strong ? "text-right font-semibold text-navy" : "text-right font-medium text-navy"}>{value}</dd>
    </div>
  )
}
