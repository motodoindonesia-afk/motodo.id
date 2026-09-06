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
  listingStatusLabel,
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

export function SellerDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  useReviewsLive()
  useListingsLive()
  useChatLive()
  useOrdersLive()

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
            <h1 className="text-3xl font-bold tracking-tight text-navy">Seller Dashboard</h1>
            <SellerStatusBadge
              status={profile.status}
              label={approved ? "Verified Seller" : undefined}
            />
          </div>
          <SellerNav approved={approved} />

          <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6" aria-labelledby="verification-heading">
            <h2 id="verification-heading" className="text-lg font-bold text-navy">
              Seller verification
            </h2>
            {profile.status === "pending" ? (
              <>
                <p className="mt-3 font-medium text-navy">Seller verification is pending.</p>
                <p className="mt-2 text-sm leading-relaxed text-navy-muted">
                  Your account is currently being reviewed by Motodo.
                </p>
                <p className="mt-3 text-sm text-navy-muted">
                  You can browse the dashboard, but you cannot publish listings or sell motorcycles until you are approved.
                </p>
              </>
            ) : null}
            {profile.status === "rejected" ? (
              <>
                <p className="mt-3 font-medium text-navy">Seller verification was not approved.</p>
                {profile.rejectionReason ? (
                  <p className="mt-2 text-sm leading-relaxed text-navy">{profile.rejectionReason}</p>
                ) : null}
                <Button className="mt-4" onClick={() => navigate("/seller/register")}>
                  Edit Registration
                </Button>
              </>
            ) : null}
            {approved ? (
              <p className="mt-3 font-medium text-navy">Your seller account is verified.</p>
            ) : null}
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Seller Rating</h2>
            <div className="mt-3">
              <CompactRating
                average={getSellerRatingSummary(sellerId).average}
                count={getSellerRatingSummary(sellerId).count}
                emptyLabel="You don't have any reviews yet."
              />
            </div>
            <Button className="mt-4" variant="secondary" onClick={() => navigate("/seller/reviews")}>
              View Reviews
            </Button>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active Listings" value={listingCounts.active} />
            <StatCard label="Draft Listings" value={listingCounts.draft} />
            <StatCard label="Sold Listings" value={listingCounts.sold} />
            <StatCard label="Total Orders" value={orderCounts.total} />
          </section>

          <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Pending Orders" value={orderCounts.pending} />
            <StatCard label="Confirmed Orders" value={orderCounts.confirmed} />
            <StatCard label="Completed Orders" value={orderCounts.completed} />
            <StatCard label="Cancelled Orders" value={orderCounts.cancelled} />
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Transaction Summary</h2>
            <p className="mt-1 text-sm text-navy-muted">All Time · confirmed and completed orders only</p>
            <dl className="mt-4 space-y-2 text-sm">
              <MoneyRow label="Gross Transaction Value" value={formatIDR(allTime.gross)} />
              <MoneyRow label="Motodo Success Fee" value={`-${formatIDR(allTime.fee)}`} />
              <MoneyRow label="Seller Net" value={formatIDR(allTime.net)} strong />
            </dl>
            <p className="mt-3 text-xs text-navy-muted">
              Motodo charges a 2% success fee per transaction. Cancelled orders are not included.
            </p>
            {allTime.pendingCount > 0 ? (
              <p className="mt-3 text-sm text-navy-muted">
                Pending orders: {allTime.pendingCount} · {formatIDR(allTime.pendingValue)} (not included in revenue)
              </p>
            ) : null}
            <div className="mt-5 border-t border-line pt-5">
              <p className="text-sm font-semibold text-navy">This Month</p>
              <dl className="mt-3 space-y-2 text-sm">
                <MoneyRow label="Gross Transaction Value" value={formatIDR(thisMonth.gross)} />
                <MoneyRow label="Motodo Success Fee" value={`-${formatIDR(thisMonth.fee)}`} />
                <MoneyRow label="Seller Net" value={formatIDR(thisMonth.net)} />
              </dl>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-navy">Recent Orders</h2>
              <ViewAllLink href="/seller/orders">View All Orders</ViewAllLink>
            </div>
            {recentOrders.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-navy-muted">No orders yet.</p>
                <Button className="mt-4" onClick={() => navigate(approved ? "/seller/listings" : "/seller/profile")}>
                  View Listings
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
                          {order.buyerName || "Buyer"} · {order.quantity} {order.quantity === 1 ? "unit" : "units"} ·{" "}
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
                <h2 className="text-lg font-bold text-navy">Recent Messages</h2>
                <UnreadBadge count={unread} />
              </div>
              <ViewAllLink href="/seller/messages">View All Messages</ViewAllLink>
            </div>
            {conversations.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-navy-muted">No buyer messages yet.</p>
                <Button className="mt-4" onClick={() => navigate("/seller/messages")}>
                  View Messages
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
                          {conversation.lastMessage || "No messages yet."}
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
              <h2 className="text-lg font-bold text-navy">Your Listings</h2>
              <div className="flex flex-wrap gap-3">
                {approved ? (
                  <>
                    <ViewAllLink href="/seller/listings">Manage Listings</ViewAllLink>
                    <Button onClick={() => navigate("/seller/listings/new")}>Add Motorcycle</Button>
                  </>
                ) : null}
              </div>
            </div>
            {listings.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-navy-muted">No motorcycles listed yet.</p>
                {approved ? (
                  <Button className="mt-4" onClick={() => navigate("/seller/listings/new")}>
                    Add Your First Motorcycle
                  </Button>
                ) : (
                  <p className="mt-2 text-sm text-navy-muted">Listing is available after Motodo approves your seller account.</p>
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
                      <p className="font-semibold text-navy">{listing.name || "Untitled motorcycle"}</p>
                      <p className="mt-1 text-sm font-medium text-brand">{formatIDR(listing.price)}</p>
                      <p className="mt-1 text-xs text-navy-muted">
                        {(() => {
                          const stock = listingStockSummary(listing)
                          if (stock.available <= 0 || listing.status === "sold") return "SOLD OUT"
                          return `Available: ${stock.available}${stock.reserved > 0 ? ` · Reserved: ${stock.reserved}` : ""}`
                        })()}{" "}
                        · {listingStatusLabel(listing.status)}
                      </p>
                    </div>
                    {approved ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}`)}>
                          View
                        </Button>
                        <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
                          Edit
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
              <h2 className="text-lg font-bold text-navy">Inventory</h2>
              <p className="mt-3 text-2xl font-bold text-navy">{availableUnits} units available</p>
              <p className="mt-2 text-sm text-navy-muted">Purchasable units on your active listings.</p>
            </div>
            <div className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">Low Inventory</h2>
              {lowInventory.length === 0 ? (
                <p className="mt-3 text-sm text-navy-muted">No active listings with 2 or fewer units.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {lowInventory.map((listing) => (
                    <li key={listing.id} className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-navy">{listing.name}</p>
                        <p className="text-xs text-navy-muted">
                          {listingStockSummary(listing).available}{" "}
                          {listingStockSummary(listing).available === 1 ? "unit" : "units"} remaining · {formatIDR(listing.price)}
                        </p>
                      </div>
                      {approved ? (
                        <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
                          Edit Listing
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
              <h2 className="text-lg font-bold text-navy">SOLD OUT</h2>
              <ul className="mt-3 space-y-2">
                {soldOut.slice(0, 5).map((listing) => (
                  <li key={listing.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-navy">{listing.name}</span>
                    <span className="text-navy-muted">SOLD OUT</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Quick Actions</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button disabled={!approved} onClick={() => navigate("/seller/listings/new")}>
                + Add Motorcycle
              </Button>
              <Button variant="secondary" disabled={!approved} onClick={() => navigate("/seller/listings")}>
                Manage Listings
              </Button>
              <Button variant="secondary" onClick={() => navigate("/seller/orders")}>
                Orders
              </Button>
              <Button variant="secondary" onClick={() => navigate("/seller/messages")}>
                Messages
              </Button>
              <Button variant="secondary" onClick={() => navigate("/seller/profile/edit")}>
                Edit Seller Profile
              </Button>
            </div>
            {!approved ? (
              <p className="mt-3 text-sm text-navy-muted">
                Add Motorcycle and Manage Listings unlock after your seller account is approved.
              </p>
            ) : null}
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Seller Profile</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <MoneyRow label="Business Name" value={profile.businessName} />
              <MoneyRow label="Seller Name" value={profile.fullName} />
              <MoneyRow label="City" value={profile.city} />
              <MoneyRow label="NIB" value={profile.nib} />
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Verification Status</dt>
                <dd>
                  <SellerStatusBadge status={profile.status} label={approved ? "Verified Seller" : undefined} />
                </dd>
              </div>
            </dl>
            <Button className="mt-5" onClick={() => navigate("/seller/profile/edit")}>
              Edit Seller Profile
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
