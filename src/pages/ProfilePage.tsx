import { Heart, MessageCircle, Package, ShoppingCart } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { useFavorites } from "../context/FavoritesContext"
import { formatMemberSince } from "../lib/profile"
import { formatOrderDate, getBuyerOrders, isOrdersReady, orderPublicRef } from "../lib/orders"
import { getUnreadCount } from "../lib/chat"
import { useOrdersLive } from "../lib/useOrdersLive"
import { useChatLive } from "../lib/useChatLive"
import { useListingsLive } from "../lib/useListingsLive"
import { useSellerLive } from "../lib/useSellerLive"
import { deleteListing, getListingsBySeller } from "../lib/listings"
import { getSellerProfile, isSellerProfilesReady } from "../lib/seller"
import { getPublicHomeListings } from "../components/home/homeListings"
import { SellerStatusBadge } from "../components/seller/SellerStatusBadge"
import { SellerListingCard } from "../components/seller/SellerListingCard"
import { DeleteListingModal } from "../components/seller/DeleteListingModal"
import { OrderStatusBadge } from "../components/orders/OrderStatusBadge"
import { AccountLayout } from "../components/profile/AccountLayout"
import { UserAvatar } from "../components/profile/UserAvatar"
import { Button } from "../components/ui/Button"
import { ViewAllLink } from "../components/ui/ViewAllLink"
import { useLanguage } from "../i18n"
import { useState } from "react"
import type { MotorcycleListing } from "../types/sellerListing"
import type { LucideIcon } from "lucide-react"

function SellerCenter({ userId, isSellerRole }: { userId: string; isSellerRole: boolean }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  useSellerLive()
  const profile = getSellerProfile(userId)

  if (!profile && !isSellerRole) {
    return null
  }

  if (!profile) {
    return (
      <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <h2 className="text-[16px] font-semibold text-navy">{t("profile.sellerCenter")}</h2>
        <p className="mt-1 text-[13px] font-medium text-navy">{t("profile.completeReg")}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-navy-muted">{t("profile.completeRegBody")}</p>
        <Button className="mt-3 h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/register")}>
          {t("nav.becomeSeller")}
        </Button>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <h2 className="text-[16px] font-semibold text-navy">{t("profile.sellerCenter")}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-medium text-navy">
          {profile.status === "approved"
            ? t("listing.verifiedSeller")
            : profile.status === "rejected"
              ? t("seller.rejectedReg")
              : t("seller.verifyPending")}
        </p>
        <SellerStatusBadge
          status={profile.status}
          label={profile.status === "approved" ? t("listing.verifiedSeller") : undefined}
        />
      </div>
      <p className="mt-1 text-[13px] text-navy-muted">{profile.businessName}</p>
      {profile.status === "rejected" && profile.rejectionReason ? (
        <p className="mt-2 text-[13px] text-red-700">{profile.rejectionReason}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button className="h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/dashboard")}>
          {t("nav.sellerDashboard")}
        </Button>
        {profile.status === "rejected" ? (
          <Button variant="secondary" className="h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/register")}>
            {t("profile.editRegistration")}
          </Button>
        ) : null}
      </div>
    </section>
  )
}

export function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { listingIds, loading: favoritesLoading } = useFavorites()
  const { itemCount, loading: cartLoading } = useCart()
  const [deleteTarget, setDeleteTarget] = useState<MotorcycleListing | null>(null)
  useOrdersLive()
  useChatLive()
  useListingsLive()
  useSellerLive()

  if (loading || !user || !isSellerProfilesReady()) {
    return (
      <main className="bg-surface py-16">
        <p className="text-center text-sm text-navy-muted">{t("common.loading")}</p>
      </main>
    )
  }

  const displayName = profile?.fullName ?? user.fullName
  const accountType = profile?.accountType ?? user.role
  const memberSince = formatMemberSince(profile?.createdAt ?? user.createdAt)
  const ordersReady = isOrdersReady()
  const orders = ordersReady ? getBuyerOrders(user.id) : []
  const recentOrders = orders.slice(0, 3)
  const unreadMessages = getUnreadCount(user.id, "buyer")
  const sellerListings = getListingsBySeller(user.id)
  const sellerProfile = getSellerProfile(user.id)
  const discovery = getPublicHomeListings()?.[0] ?? null

  return (
    <AccountLayout showIdentityBar={false}>
      <div className="space-y-3">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-card min-[769px]:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar name={displayName} size="hero" />
            <div className="min-w-0 flex-1">
              <h1 className="text-[20px] font-semibold tracking-tight text-navy sm:text-[22px]">{displayName}</h1>
              <p className="mt-1 truncate text-[14px] text-navy-muted">{user.email}</p>
              {memberSince && memberSince !== "—" ? (
                <p className="mt-1 text-[12px] text-navy-muted">
                  {t("profile.memberSince")} {memberSince}
                </p>
              ) : null}
            </div>
            <Button className="h-10 w-full shrink-0 px-4 py-2 text-[14px] sm:w-auto" onClick={() => navigate("/profile/edit")}>
              {t("account.editProfile")}
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 min-[769px]:grid-cols-4 min-[769px]:gap-2.5">
          <QuickCard
            to="/orders"
            icon={Package}
            label={t("account.navOrders")}
            count={ordersReady ? orders.length : undefined}
          />
          <QuickCard
            to="/wishlist"
            icon={Heart}
            label={t("account.navWishlist")}
            count={favoritesLoading ? undefined : listingIds.size}
          />
          <QuickCard
            to="/cart"
            icon={ShoppingCart}
            label={t("account.navCart")}
            count={cartLoading ? undefined : itemCount}
          />
          <QuickCard to="/messages" icon={MessageCircle} label={t("account.navMessages")} count={unreadMessages} />
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-[18px] font-semibold text-navy">{t("account.recentOrders")}</h2>
            {orders.length > 0 ? <ViewAllLink href="/orders">{t("common.viewAll")}</ViewAllLink> : null}
          </div>
          {!ordersReady ? (
            <p className="mt-4 text-[13px] text-navy-muted">{t("common.loading")}</p>
          ) : recentOrders.length === 0 ? (
            <div className="mt-4 py-4 text-center">
              <p className="text-[14px] font-medium text-navy">{t("account.ordersEmptyTitle")}</p>
              <p className="mt-1 text-[13px] text-navy-muted">{t("account.ordersEmptyBody")}</p>
              <Button className="mt-3 h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/browse")}>
                {t("common.browseMotorcycles")}
              </Button>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/orders/${orderPublicRef(order)}`}
                    className="flex gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-surface sm:size-16">
                      {order.listingImage ? (
                        <img src={order.listingImage} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[14px] font-medium text-navy">{order.listingName}</span>
                        <OrderStatusBadge status={order.status} />
                      </span>
                      <span className="mt-0.5 block text-[12px] text-navy-muted">{orderPublicRef(order)}</span>
                      <span className="mt-0.5 block text-[12px] text-navy-muted">{formatOrderDate(order.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {discovery ? (
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <Link
              to={`/motorcycles/${discovery.id}`}
              className="flex min-w-0 flex-col sm:flex-row"
            >
              <span className="aspect-[16/9] w-full shrink-0 overflow-hidden bg-surface sm:aspect-auto sm:h-auto sm:w-[220px]">
                {discovery.image ? (
                  <img src={discovery.image} alt={discovery.name} className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
                <span className="text-[12px] font-medium tracking-wide text-brand uppercase">{t("account.discover")}</span>
                <span className="mt-1 line-clamp-2 text-[15px] font-semibold text-navy">{discovery.name}</span>
                <span className="mt-1 text-[16px] font-bold text-brand">{discovery.price}</span>
                <span className="mt-2 text-[13px] font-medium text-navy-muted">{t("account.discoverCta")}</span>
              </span>
            </Link>
          </section>
        ) : null}

        <SellerCenter userId={user.id} isSellerRole={accountType === "seller"} />

        {sellerProfile ? (
          <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <h2 className="text-[16px] font-semibold text-navy">{t("profile.myListings")}</h2>
            {sellerListings.length === 0 ? (
              <div className="mt-3 text-center">
                <p className="text-[13px] text-navy-muted">{t("profile.noListings")}</p>
                {sellerProfile.status === "approved" ? (
                  <Button className="mt-3 h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/listings/new")}>
                    {t("profile.addMotorcycle")}
                  </Button>
                ) : (
                  <p className="mt-2 text-[13px] text-navy-muted">{t("profile.listingAfterApproval")}</p>
                )}
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                {sellerListings.map((listing) => (
                  <SellerListingCard key={listing.id} listing={listing} onDelete={setDeleteTarget} />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
      {deleteTarget ? (
        <DeleteListingModal
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteListing(deleteTarget.id, user.id)
            setDeleteTarget(null)
          }}
        />
      ) : null}
    </AccountLayout>
  )
}

function QuickCard({
  to,
  icon: Icon,
  label,
  count,
}: {
  to: string
  icon: LucideIcon
  label: string
  count?: number
}) {
  return (
    <Link
      to={to}
      className="flex min-h-[76px] flex-col justify-between rounded-xl border border-line bg-white p-2.5 shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand min-[769px]:min-h-[84px] min-[769px]:rounded-2xl min-[769px]:p-3"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[13px] font-medium text-navy">{label}</span>
        {typeof count === "number" ? (
          <span className="mt-0.5 block text-[12px] text-navy-muted">{count}</span>
        ) : null}
      </span>
    </Link>
  )
}
