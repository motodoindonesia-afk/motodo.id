/** Kept for reference. Ritme uses RitmeShell navigation instead. */
import { NavLink } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getPendingSellerCount } from "../../lib/adminPlatform"
import { getUnreadNotificationCount } from "../../lib/notifications"
import { useNotificationsLive } from "../../lib/useNotificationsLive"
import { useSellerLive } from "../../lib/useSellerLive"
import { UnreadBadge } from "../chat/UnreadBadge"
import { cn } from "../../lib/cn"

const LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/sellers", label: "Sellers" },
  { to: "/admin/listings", label: "Listings" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/settings", label: "Settings" },
] as const

export function AdminNav() {
  const { user } = useAuth()
  useSellerLive()
  useNotificationsLive()
  const pendingSellers = getPendingSellerCount()
  const unread = user ? getUnreadNotificationCount(user.id) : 0

  return (
    <nav className="mt-6 overflow-x-auto" aria-label="Admin">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={"end" in link ? link.end : false}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium",
                  isActive ? "border-b-2 border-brand text-brand" : "text-navy hover:text-brand",
                )
              }
            >
              {link.label}
              {link.label === "Sellers" && pendingSellers > 0 ? (
                <span className="rounded-full bg-surface px-1.5 text-xs text-navy" aria-label={`${pendingSellers} pending sellers`}>
                  {pendingSellers}
                </span>
              ) : null}
              {link.label === "Dashboard" ? <UnreadBadge count={unread} /> : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
