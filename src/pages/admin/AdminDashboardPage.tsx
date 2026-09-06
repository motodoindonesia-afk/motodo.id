import { Link } from "react-router-dom"
import { Container } from "../../components/layout/Container"
import { useAuth } from "../../context/AuthContext"
import {
  formatMoney,
  getActionRequired,
  getPendingSellerCount,
  getPlatformStats,
  getRecentActivity,
} from "../../lib/adminPlatform"
import { getUnreadNotificationCount } from "../../lib/notifications"
import { formatShortDate } from "../../lib/profile"
import { SELLER_SUCCESS_FEE_RATE } from "../../lib/orders"
import { useListingsLive } from "../../lib/useListingsLive"
import { useNotificationsLive } from "../../lib/useNotificationsLive"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { useSellerLive } from "../../lib/useSellerLive"
import { SellerDataGate } from "../../components/seller/SellerDataGate"
import { OrdersDataGate } from "../../components/orders/OrdersDataGate"
import { ReviewsDataGate } from "../../components/reviews/ReviewsDataGate"

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-5">
      <p className="text-sm text-navy-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{value}</p>
    </div>
  )
}

export function AdminDashboardPage() {
  return (
    <SellerDataGate>
      <OrdersDataGate>
        <ReviewsDataGate>
          <AdminDashboardInner />
        </ReviewsDataGate>
      </OrdersDataGate>
    </SellerDataGate>
  )
}

function AdminDashboardInner() {
  const { user } = useAuth()
  useSellerLive()
  useListingsLive()
  useOrdersLive()
  useReviewsLive()
  useNotificationsLive()
  const stats = getPlatformStats()
  const alerts = getActionRequired()
  const activity = getRecentActivity()
  const unread = user ? getUnreadNotificationCount(user.id) : 0
  const pendingSellers = getPendingSellerCount()
  const feePercent = Math.round(SELLER_SUCCESS_FEE_RATE * 100)

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Dashboard</h1>
          <p className="mt-2 text-navy-muted">Motodo Operations</p>

          {unread > 0 || pendingSellers > 0 ? (
            <p className="mt-4 text-sm text-navy-muted">
              {pendingSellers > 0 ? `Pending Sellers [${pendingSellers}]` : null}
              {pendingSellers > 0 && unread > 0 ? " · " : null}
              {unread > 0 ? `${unread} unread ${unread === 1 ? "notification" : "notifications"}` : null}
            </p>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Users" value={stats.totalUsers} />
            <StatCard label="Total Sellers" value={stats.totalSellers} />
            <StatCard label="Pending Sellers" value={stats.pendingSellers} />
            <StatCard label="Active Listings" value={stats.activeListings} />
            <StatCard label="Pending Orders" value={stats.pendingOrders} />
            <StatCard label="Completed Orders" value={stats.completedOrders} />
            <StatCard label="Total Transaction Value" value={formatMoney(stats.grossTransactionValue)} />
            <StatCard label={`Motodo Success Fee (${feePercent}%)`} value={formatMoney(stats.motodoSuccessFee)} />
          </div>

          <section className="mt-8 rounded-2xl border border-line px-5 py-6">
            <h2 className="text-lg font-bold text-navy">Platform Revenue</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-navy-muted">Gross Transaction Value</dt>
                <dd className="mt-1 text-xl font-semibold text-navy">{formatMoney(stats.grossTransactionValue)}</dd>
              </div>
              <div>
                <dt className="text-sm text-navy-muted">Motodo Success Fee</dt>
                <dd className="mt-1 text-xl font-semibold text-navy">{formatMoney(stats.motodoSuccessFee)}</dd>
              </div>
              <div>
                <dt className="text-sm text-navy-muted">Seller Net Amount</dt>
                <dd className="mt-1 text-xl font-semibold text-navy">{formatMoney(stats.sellerNetAmount)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-navy-muted">
              Includes confirmed and completed orders. Cancelled and pending orders are excluded from revenue.
            </p>
          </section>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Approved Sellers" value={stats.approvedSellers} />
            <StatCard label="Rejected Sellers" value={stats.rejectedSellers} />
            <StatCard label="Total Listings" value={stats.totalListings} />
            <StatCard label="Draft Listings" value={stats.draftListings} />
            <StatCard label="Sold Listings" value={stats.soldListings} />
            <StatCard label="Total Orders" value={stats.totalOrders} />
            <StatCard label="Confirmed Orders" value={stats.confirmedOrders} />
            <StatCard label="Cancelled Orders" value={stats.cancelledOrders} />
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-bold text-navy">Action Required</h2>
            {alerts.length === 0 ? (
              <p className="mt-4 text-sm text-navy-muted">No items need attention right now.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                {alerts.map((item) => (
                  <li key={item.id}>
                    <Link to={item.href} className="block px-5 py-4 text-sm font-medium text-navy hover:bg-surface">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-bold text-navy">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="mt-4 text-sm text-navy-muted">No platform activity yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
                {activity.map((item) => (
                  <li key={item.id}>
                    <Link to={item.href} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-surface">
                      <span className="text-sm font-medium text-navy">{item.label}</span>
                      <span className="text-xs text-navy-muted">{formatShortDate(item.at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Container>
    </main>
  )
}
