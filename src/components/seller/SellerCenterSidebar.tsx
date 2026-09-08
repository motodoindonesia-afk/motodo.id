import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  LayoutDashboard,
  MessageCircle,
  Package,
  Palette,
  Settings,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/cn"
import { useT, type MessageKey } from "../../i18n"

type NavItem = {
  id: string
  label: MessageKey
  to?: string
  available: boolean
  icon: LucideIcon
  match?: "exact" | "prefix"
}

const MAIN_ITEMS: NavItem[] = [
  { id: "dashboard", label: "seller.dashboard", to: "/seller/dashboard", available: true, icon: LayoutDashboard, match: "exact" },
  { id: "products", label: "seller.navProducts", to: "/seller/listings", available: true, icon: Package, match: "prefix" },
  { id: "orders", label: "seller.orders", to: "/seller/orders", available: true, icon: ShoppingBag, match: "prefix" },
  { id: "messages", label: "seller.messages", to: "/seller/messages", available: true, icon: MessageCircle, match: "prefix" },
  { id: "reviews", label: "seller.reviews", to: "/seller/reviews", available: true, icon: Star, match: "prefix" },
  { id: "performance", label: "seller.navPerformance", available: false, icon: BarChart3 },
]

const STORE_ITEMS: NavItem[] = [
  { id: "storeProfile", label: "seller.navStoreProfile", to: "/seller/profile", available: true, icon: Store, match: "prefix" },
  { id: "storeLook", label: "seller.navStoreLook", available: false, icon: Palette },
]

const SETTING_ITEMS: NavItem[] = [
  { id: "settings", label: "seller.navSettings", available: false, icon: Settings },
]

function isActive(item: NavItem, pathname: string) {
  if (!item.to) return false
  if (item.match === "exact") return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function SellerCenterSidebar() {
  const t = useT()
  const location = useLocation()

  return (
    <aside className="hidden w-[252px] shrink-0 min-[1024px]:block">
      <div className="rounded-2xl border border-line bg-white p-3 shadow-card">
        <p className="px-2 text-[11px] font-semibold tracking-wide text-navy-muted uppercase">{t("seller.center")}</p>
        <NavGroup items={MAIN_ITEMS} pathname={location.pathname} />
        <div className="my-2 border-t border-line" />
        <p className="px-2 text-[11px] font-semibold tracking-wide text-navy-muted uppercase">{t("seller.sectionStore")}</p>
        <NavGroup items={STORE_ITEMS} pathname={location.pathname} />
        <div className="my-2 border-t border-line" />
        <p className="px-2 text-[11px] font-semibold tracking-wide text-navy-muted uppercase">{t("seller.sectionSettings")}</p>
        <NavGroup items={SETTING_ITEMS} pathname={location.pathname} />
      </div>
    </aside>
  )
}

export function SellerCenterMobileNav() {
  const t = useT()
  const location = useLocation()
  const items = [...MAIN_ITEMS, ...STORE_ITEMS].filter((item) => item.available && item.to)

  return (
    <nav className="min-[1024px]:hidden" aria-label={t("seller.menu")}>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = isActive(item, location.pathname)
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
      </div>
    </nav>
  )
}

function NavGroup({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const t = useT()
  return (
    <ul className="mt-1">
      {items.map((item) => {
        const Icon = item.icon
        const active = isActive(item, pathname)
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
                active ? "border-brand bg-brand-soft text-brand" : "border-transparent text-navy hover:bg-surface",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {t(item.label)}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
