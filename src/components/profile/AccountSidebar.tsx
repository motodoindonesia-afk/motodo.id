import { Link, useLocation } from "react-router-dom"
import { UserAvatar } from "./UserAvatar"
import { cn } from "../../lib/cn"
import { useT, type MessageKey } from "../../i18n"

type NavItem = {
  id: string
  label: MessageKey
  to?: string
  available: boolean
}

const ACCOUNT_ITEMS: NavItem[] = [
  { id: "profile", label: "account.navProfile", to: "/profile", available: true },
  { id: "bank", label: "account.navBank", available: false },
  { id: "address", label: "account.navAddress", available: false },
  { id: "password", label: "account.navPassword", available: false },
  { id: "notify", label: "account.navNotifications", to: "/notifications", available: true },
  { id: "privacy", label: "account.navPrivacy", available: false },
]

const ACTIVITY_ITEMS: NavItem[] = [
  { id: "orders", label: "account.navOrders", to: "/orders", available: true },
  { id: "wishlist", label: "account.navWishlist", to: "/wishlist", available: true },
  { id: "cart", label: "account.navCart", to: "/cart", available: true },
  { id: "messages", label: "account.navMessages", to: "/messages", available: true },
]

const OTHER_ITEMS: NavItem[] = [
  { id: "voucher", label: "account.navVoucher", available: false },
  { id: "coins", label: "account.navCoins", available: false },
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
    <aside className="hidden w-[280px] shrink-0 min-[769px]:block">
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <UserAvatar name={name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy">{name}</p>
            <p className="truncate text-xs text-navy-muted">{username}</p>
          </div>
        </div>
        <Link
          to="/profile"
          className="mt-3 inline-flex text-[13px] font-medium text-brand hover:text-brand-hover"
        >
          {t("account.editProfile")}
        </Link>

        <NavGroup title={t("account.sectionAccount")} items={ACCOUNT_ITEMS} pathname={location.pathname} />
        <div className="my-3 border-t border-line" />
        <NavGroup title={t("account.sectionActivity")} items={ACTIVITY_ITEMS} pathname={location.pathname} />
        <div className="my-3 border-t border-line" />
        <NavGroup title={t("account.sectionOther")} items={OTHER_ITEMS} pathname={location.pathname} />
        <div className="my-3 border-t border-line" />
        <button
          type="button"
          className="w-full rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={onLogout}
        >
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
          const active = item.to === location.pathname
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
    <div className="mt-4">
      <p className="px-2 text-[11px] font-semibold tracking-wide text-navy-muted uppercase">{title}</p>
      <ul className="mt-1">
        {items.map((item) => {
          const active = Boolean(item.to && pathname === item.to)
          if (!item.available || !item.to) {
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title={t("account.comingSoon")}
                  className="flex w-full cursor-not-allowed items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] text-navy-muted/70"
                >
                  {t(item.label)}
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
                  "block rounded-md px-2 py-1.5 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  active ? "bg-brand-soft text-brand" : "text-navy hover:bg-surface",
                )}
              >
                {t(item.label)}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
