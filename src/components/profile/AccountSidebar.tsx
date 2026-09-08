import type { LucideIcon } from "lucide-react"
import {
  Bell,
  CircleHelp,
  Heart,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  ShoppingCart,
  UserRound,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { UserAvatar } from "./UserAvatar"
import { cn } from "../../lib/cn"
import { useT, type MessageKey } from "../../i18n"

type NavItem = {
  id: string
  label: MessageKey
  to?: string
  available: boolean
  icon: LucideIcon
}

const ACCOUNT_ITEMS: NavItem[] = [
  { id: "dashboard", label: "account.navDashboard", to: "/profile", available: true, icon: LayoutGrid },
  { id: "profile", label: "account.navProfile", to: "/profile/edit", available: true, icon: UserRound },
  { id: "notify", label: "account.navInbox", to: "/notifications", available: true, icon: Bell },
  { id: "settings", label: "account.navSettings", to: "/settings", available: true, icon: Settings },
]

const ACTIVITY_ITEMS: NavItem[] = [
  { id: "orders", label: "account.navOrders", to: "/orders", available: true, icon: Package },
  { id: "wishlist", label: "account.navWishlist", to: "/wishlist", available: true, icon: Heart },
  { id: "cart", label: "account.navCart", to: "/cart", available: true, icon: ShoppingCart },
  { id: "messages", label: "account.navMessages", to: "/messages", available: true, icon: MessageCircle },
]

const HELP_ITEMS: NavItem[] = [
  { id: "help", label: "account.navHelp", to: "/#help", available: true, icon: CircleHelp },
]

export function AccountSidebar({
  name,
  username,
  onLogout,
}: {
  name: string
  username: string
  onLogout: () => void
}) {
  const t = useT()
  const location = useLocation()

  return (
    <aside className="hidden w-[260px] shrink-0 min-[769px]:block">
      <div className="rounded-2xl border border-line bg-white p-3 shadow-card">
        <Link to="/profile" className="flex items-center gap-3 rounded-xl px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <UserAvatar name={name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-navy">{name}</p>
            <p className="truncate text-[12px] text-navy-muted">{username}</p>
          </div>
        </Link>
        <Link
          to="/profile/edit"
          className="mt-2 inline-flex px-1 text-[13px] font-medium text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {t("account.editProfile")}
        </Link>

        <NavGroup title={t("account.sectionAccount")} items={ACCOUNT_ITEMS} pathname={location.pathname} />
        <div className="my-2 border-t border-line" />
        <NavGroup title={t("account.sectionActivity")} items={ACTIVITY_ITEMS} pathname={location.pathname} />
        <div className="my-2 border-t border-line" />
        <NavGroup title={t("account.sectionHelp")} items={HELP_ITEMS} pathname={location.pathname} />
        <div className="my-2 border-t border-line" />
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={onLogout}
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {t("common.logout")}
        </button>
      </div>
    </aside>
  )
}

export function AccountMobileNav({ onLogout }: { onLogout: () => void }) {
  const t = useT()
  const location = useLocation()
  const items = [...ACCOUNT_ITEMS, ...ACTIVITY_ITEMS].filter((item) => item.available && item.to)

  return (
    <nav className="min-[769px]:hidden" aria-label={t("account.menu")}>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = isActive(item.to, location.pathname)
          return (
            <Link
              key={item.id}
              to={item.to!}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                active
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-white text-navy hover:border-brand/40",
              )}
            >
              {t(item.label)}
            </Link>
          )
        })}
        <button
          type="button"
          className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={onLogout}
        >
          {t("common.logout")}
        </button>
      </div>
    </nav>
  )
}

function isActive(to: string | undefined, pathname: string) {
  if (!to || to.startsWith("/#")) return false
  if (to === "/profile") return pathname === "/profile"
  return pathname === to
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string
  items: NavItem[]
  pathname: string
}) {
  const t = useT()
  return (
    <div className="mt-3">
      <p className="px-2 text-[11px] font-semibold tracking-wide text-navy-muted uppercase">{title}</p>
      <ul className="mt-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.to, pathname)
          if (!item.available || !item.to) {
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title={t("account.comingSoon")}
                  className="flex w-full cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-navy-muted/70"
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{t(item.label)}</span>
                  <span className="text-[10px]">{t("account.soonBadge")}</span>
                </button>
              </li>
            )
          }
          return (
            <li key={item.id}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md border-l-2 px-2 py-1.5 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  active
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-transparent text-navy hover:bg-surface",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {t(item.label)}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
