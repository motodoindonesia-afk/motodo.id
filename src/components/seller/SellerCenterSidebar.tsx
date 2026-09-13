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
  { id: "storeLook", label: "seller.navStoreLook", to: "/seller/profile#store-cover", available: true, icon: Palette, match: "exact" },
]

const SETTING_ITEMS: NavItem[] = [
  { id: "settings", label: "seller.navSettings", to: "/seller/settings", available: true, icon: Settings, match: "prefix" },
]

function isActive(item: NavItem, pathname: string, hash: string) {
  if (!item.to) return false
  const [path] = item.to.split("#")
  const pathMatch =
    item.match === "exact" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)
  if (!pathMatch) return false
  if (item.id === "storeLook") return hash === "#store-cover"
  if (item.id === "storeProfile") return hash !== "#store-cover"
  return true
}

export function SellerCenterSidebar() {
  const t = useT()
  const location = useLocation()

  return (
    <aside className="hidden w-[252px] shrink-0 min-[1024px]:block">
      <div className="rounded-2xl border border-line bg-white p-3 shadow-card">
        <p className="px-2 text-meta font-semibold tracking-wide text-navy-muted uppercase">{t("seller.center")}</p>
        <NavGroup items={MAIN_ITEMS} pathname={location.pathname} hash={location.hash} />
        <div className="my-2 border-t border-line" />
        <p className="px-2 text-meta font-semibold tracking-wide text-navy-muted uppercase">{t("seller.sectionStore")}</p>
        <NavGroup items={STORE_ITEMS} pathname={location.pathname} hash={location.hash} />
        <div className="my-2 border-t border-line" />
        <p className="px-2 text-meta font-semibold tracking-wide text-navy-muted uppercase">{t("seller.sectionSettings")}</p>
        <NavGroup items={SETTING_ITEMS} pathname={location.pathname} hash={location.hash} />
      </div>
    </aside>
  )
}

export function SellerCenterMobileNav() {
  const t = useT()
  const location = useLocation()
  const items = [...MAIN_ITEMS, ...STORE_ITEMS, ...SETTING_ITEMS].filter((item) => item.available && item.to)

  return (
    <nav className="min-w-0 min-[1024px]:hidden" aria-label={t("seller.menu")}>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const active = isActive(item, location.pathname, location.hash)
          return (
            <Link
              key={item.id}
              to={item.to!}
              className={cn(
                "rounded-full border px-3 py-1.5 text-ui font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
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

function NavGroup({ items, pathname, hash }: { items: NavItem[]; pathname: string; hash: string }) {
  const t = useT()
  return (
    <ul className="mt-1">
      {items.map((item) => {
        const Icon = item.icon
        const active = isActive(item, pathname, hash)
        if (!item.available || !item.to) {
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title={t("account.comingSoon")}
                className="flex w-full cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-navy-muted/70"
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
                "flex items-center gap-2 rounded-md border-l-2 px-2 py-1.5 text-ui font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
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
