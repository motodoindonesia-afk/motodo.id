import { NavLink } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getUnreadCount } from "../../lib/chat"
import { getSellerOrderCounts } from "../../lib/orders"
import { useChatLive } from "../../lib/useChatLive"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { UnreadBadge } from "../chat/UnreadBadge"
import { cn } from "../../lib/cn"
import { useT, type MessageKey } from "../../i18n"

const LINKS: { to: string; key: MessageKey; approvedOnly?: boolean; messages?: boolean; orders?: boolean }[] = [
  { to: "/seller/dashboard", key: "seller.dashboard" },
  { to: "/seller/listings", key: "seller.listings", approvedOnly: true },
  { to: "/seller/orders", key: "seller.orders", orders: true },
  { to: "/seller/reviews", key: "seller.reviews" },
  { to: "/seller/messages", key: "seller.messages", messages: true },
  { to: "/seller/profile", key: "seller.profile" },
]

export function SellerNav({ approved }: { approved: boolean }) {
  const { user } = useAuth()
  const t = useT()
  useChatLive()
  useOrdersLive()
  const unread = user ? getUnreadCount(user.id, "seller") : 0
  const pendingOrders = user ? getSellerOrderCounts(user.id).pending : 0

  return (
    <nav className="mt-6 overflow-x-auto" aria-label={t("seller.nav")}>
      <ul className="flex min-w-max gap-1 border-b border-line">
        {LINKS.map((link) => {
          if (link.approvedOnly && !approved) return null
          return (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/seller/dashboard"}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium",
                    isActive ? "border-b-2 border-brand text-brand" : "text-navy hover:text-brand",
                  )
                }
              >
                {t(link.key)}
                {link.messages ? <UnreadBadge count={unread} /> : null}
                {link.orders && pendingOrders > 0 ? (
                  <span className="rounded-full bg-surface px-1.5 text-xs text-navy">{pendingOrders}</span>
                ) : null}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
