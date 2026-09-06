import { NavLink } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getUnreadCount } from "../../lib/chat"
import { getSellerOrderCounts } from "../../lib/orders"
import { useChatLive } from "../../lib/useChatLive"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { UnreadBadge } from "../chat/UnreadBadge"
import { cn } from "../../lib/cn"

const LINKS = [
  { to: "/seller/dashboard", label: "Dashboard" },
  { to: "/seller/listings", label: "Listings", approvedOnly: true },
  { to: "/seller/orders", label: "Orders" },
  { to: "/seller/reviews", label: "Reviews" },
  { to: "/seller/messages", label: "Messages" },
  { to: "/seller/profile", label: "Profile" },
] as const

export function SellerNav({ approved }: { approved: boolean }) {
  const { user } = useAuth()
  useChatLive()
  useOrdersLive()
  const unread = user ? getUnreadCount(user.id, "seller") : 0
  const pendingOrders = user ? getSellerOrderCounts(user.id).pending : 0

  return (
    <nav className="mt-6 overflow-x-auto" aria-label="Seller">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {LINKS.map((link) => {
          if ("approvedOnly" in link && link.approvedOnly && !approved) return null
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
                {link.label}
                {link.label === "Messages" ? <UnreadBadge count={unread} /> : null}
                {link.label === "Orders" && pendingOrders > 0 ? (
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
