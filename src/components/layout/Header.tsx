import { ChevronDown, Heart, Menu, Search, ShoppingCart, X } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import { displayName } from "../../lib/auth"
import { getSellerProfile, isSellerProfilesReady } from "../../lib/seller"
import { getUnreadCount } from "../../lib/chat"
import { getUnreadNotificationCount } from "../../lib/notifications"
import { useSellerLive } from "../../lib/useSellerLive"
import { useChatLive } from "../../lib/useChatLive"
import { useNotificationsLive } from "../../lib/useNotificationsLive"
import { UnreadBadge } from "../chat/UnreadBadge"
import { navLinks, searchQuickLinks } from "../../data/site"
import { SearchBar } from "../ui/SearchBar"
import { Container } from "./Container"
import { UtilityBar } from "./UtilityBar"
import { MotodoLogoLockup } from "../brand/MotodoLogo"
import { UserAvatar } from "../profile/UserAvatar"
import { cn } from "../../lib/cn"
import { LanguageSwitcher, useT, type MessageKey } from "../../i18n"

const NAV_KEYS: Record<string, MessageKey> = {
  "/browse": "nav.browse",
  "/#categories": "nav.categories",
  "/sell": "nav.sellMotorcycle",
  "/#about": "footer.about",
}

const QUICK_KEYS: Record<string, MessageKey> = {
  Aksesoris: "quick.accessories",
  Apparel: "quick.apparel",
  Sparepart: "quick.sparepart",
  Custom: "quick.custom",
}

const menuItemClass =
  "flex min-h-11 w-full items-center text-ui font-medium text-navy hover:text-brand"

const menuNestedClass =
  "flex min-h-10 w-full items-center rounded-md px-3 text-ui font-medium text-navy hover:text-brand"

function isAccountMenuPath(pathname: string) {
  return (
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/") ||
    pathname === "/wishlist" ||
    pathname === "/cart" ||
    pathname === "/messages" ||
    pathname.startsWith("/messages/") ||
    pathname === "/notifications"
  )
}

function isSellerMenuPath(pathname: string) {
  return pathname === "/sell" || pathname === "/seller" || pathname.startsWith("/seller/")
}

function isMenuActive(pathname: string, to: string) {
  if (to === "/settings") return pathname === "/settings"
  if (to === "/profile/edit") return pathname === "/profile/edit"
  if (
    to === "/orders" ||
    to === "/messages" ||
    to === "/seller/listings" ||
    to === "/seller/orders" ||
    to === "/seller/messages" ||
    to === "/seller/profile" ||
    to === "/seller/settings"
  ) {
    return pathname === to || pathname.startsWith(`${to}/`)
  }
  return pathname === to
}

type HeaderNavItem = {
  to: string
  label: MessageKey
  badge?: "buyer" | "seller" | "notify"
}

const ACCOUNT_NAV_ITEMS: HeaderNavItem[] = [
  { to: "/profile/edit", label: "account.navProfile" },
  { to: "/orders", label: "account.navOrders" },
  { to: "/wishlist", label: "account.navWishlist" },
  { to: "/cart", label: "account.navCart" },
  { to: "/messages", label: "common.messages", badge: "buyer" },
  { to: "/notifications", label: "common.notifications", badge: "notify" },
]

const SELLER_NAV_ITEMS: HeaderNavItem[] = [
  { to: "/seller/dashboard", label: "seller.dashboard" },
  { to: "/seller/listings", label: "nav.listings" },
  { to: "/seller/orders", label: "seller.orders" },
  { to: "/seller/messages", label: "seller.messages", badge: "seller" },
  { to: "/seller/profile", label: "seller.navStoreProfile" },
  { to: "/seller/settings", label: "seller.navSettings" },
  { to: "/sell", label: "nav.sellMotorcycle" },
]

export function Header() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { itemCount } = useCart()
  useSellerLive()
  useChatLive()
  useNotificationsLive()
  const sellerProfile = user && isSellerProfilesReady() ? getSellerProfile(user.id) : null
  const sellerRegistered = Boolean(sellerProfile)
  const buyerUnread = user ? getUnreadCount(user.id, "buyer") : 0
  const sellerUnread = user && sellerRegistered ? getUnreadCount(user.id, "seller") : 0
  const notificationUnread = user ? getUnreadNotificationCount(user.id) : 0
  const sellerHref = sellerRegistered ? "/seller/dashboard" : "/seller/register"

  useEffect(() => {
    function closeOnDesktop() {
      if (window.matchMedia("(min-width: 769px)").matches) setOpen(false)
    }
    window.addEventListener("resize", closeOnDesktop)
    return () => window.removeEventListener("resize", closeOnDesktop)
  }, [])

  function focusMobileSearch() {
    document.getElementById("header-search-mobile")?.focus()
  }

  function goToBrowse(query: string) {
    const trimmed = query.trim()
    navigate(trimmed ? `/browse?q=${encodeURIComponent(trimmed)}` : "/browse")
    setOpen(false)
  }

  function handleLogout() {
    setOpen(false)
    navigate("/", { replace: true })
    logout()
  }

  return (
    <header className="sticky top-0 z-40 w-full min-w-0 border-b border-line bg-white">
      <UtilityBar sellerHref={sellerHref} notificationUnread={notificationUnread} />

      <div className="min-w-0 min-[769px]:hidden">
        <div className="flex h-14 min-w-0 items-center justify-between gap-2 px-4">
          <Link
            to="/"
            aria-label="Motodo home"
            className="flex h-10 shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <MotodoLogoLockup stackedClassName="h-10 w-[83px]" />
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-md text-navy hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={t("common.search")}
              onClick={focusMobileSearch}
            >
              <Search className="size-6" strokeWidth={1.75} />
            </button>
            <Link
              to="/wishlist"
              className="flex size-11 items-center justify-center rounded-md text-navy hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={t("nav.wishlist")}
            >
              <Heart className="size-6" strokeWidth={1.75} />
            </Link>
            <CartNavLink count={itemCount} compact />
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-md text-navy hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="sr-only">{open ? t("nav.closeMenu") : t("nav.openMenu")}</span>
              {open ? <X className="size-6" strokeWidth={1.75} /> : <Menu className="size-6" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <div className="px-4 pb-2">
          <SearchBar
            id="header-search-mobile"
            variant="market"
            compact
            placeholder={t("nav.searchPlaceholder")}
            onSubmitSearch={goToBrowse}
          />
        </div>

        <nav
          className="w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t("nav.brands")}
        >
          <div className="flex w-max flex-nowrap gap-2 px-4">
            {searchQuickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="shrink-0 whitespace-nowrap rounded-full bg-surface px-2.5 py-[6px] text-ui font-medium leading-none text-brand hover:text-brand-hover"
              >
                {QUICK_KEYS[link.label] ? t(QUICK_KEYS[link.label]) : link.label}
              </Link>
            ))}
          </div>
        </nav>

        {open ? (
          <MobileMenu
            sellerRegistered={sellerRegistered}
            buyerUnread={buyerUnread}
            sellerUnread={sellerUnread}
            notificationUnread={notificationUnread}
            authenticated={Boolean(isAuthenticated && user)}
            onClose={() => setOpen(false)}
            onLogout={handleLogout}
          />
        ) : null}
      </div>

      <Container className="hidden py-2.5 min-[769px]:block">
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          <Link
            to="/"
            aria-label="Motodo home"
            className="flex h-10 shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:h-[52px] sm:w-[108px]"
          >
            <MotodoLogoLockup />
          </Link>

          <div className="min-w-0 flex-1">
            <SearchBar
              id="header-search"
              variant="market"
              placeholder={t("nav.searchPlaceholder")}
              onSubmitSearch={goToBrowse}
            />
            <nav className="mt-1.5 flex min-w-0 gap-2 overflow-x-auto pb-0.5 sm:gap-3" aria-label={t("nav.brands")}>
              {searchQuickLinks.map((link) => (
                <Link key={link.label} to={link.href} className="shrink-0 text-meta text-brand hover:text-brand-hover">
                  {QUICK_KEYS[link.label] ? t(QUICK_KEYS[link.label]) : link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex h-10 shrink-0 items-center gap-0.5 self-start sm:gap-1">
            <Link
              to="/sell"
              className="flex h-10 shrink-0 items-center rounded-md px-2 text-ui font-medium text-navy hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {t("nav.jualMotor")}
            </Link>
            <Link
              to="/wishlist"
              className="flex h-10 shrink-0 items-center rounded-md p-1.5 text-navy hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={t("nav.wishlist")}
            >
              <Heart className="size-6" strokeWidth={1.75} />
            </Link>
            <CartNavLink count={itemCount} />
            {user ? (
              <AccountMenu
                name={displayName(user)}
                sellerRegistered={sellerRegistered}
                buyerUnread={buyerUnread}
                sellerUnread={sellerUnread}
                notificationUnread={notificationUnread}
                onLogout={handleLogout}
              />
            ) : (
              <div className="ml-1 flex h-10 shrink-0 items-center gap-2 text-ui font-medium">
                <Link
                  to="/signup"
                  className="rounded-md px-1.5 text-navy hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {t("common.signup")}
                </Link>
                <Link
                  to="/login"
                  className="rounded-md bg-brand px-2.5 py-1.5 text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {t("common.login")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  )
}

function MobileNavLink({
  to,
  children,
  active,
  nested,
  onClose,
}: {
  to: string
  children: ReactNode
  active: boolean
  nested?: boolean
  onClose: () => void
}) {
  return (
    <Link
      to={to}
      className={cn(nested ? menuNestedClass : menuItemClass, active && "text-brand")}
      aria-current={active ? "page" : undefined}
      onClick={onClose}
    >
      {children}
    </Link>
  )
}

function MobileAccordion({
  id,
  label,
  open,
  onToggle,
  children,
}: {
  id: string
  label: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        className={cn(menuItemClass, "justify-between gap-3")}
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        {label}
        <ChevronDown className={cn("size-4 shrink-0 text-navy-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open ? (
        <div id={id} className="pb-1">
          {children}
        </div>
      ) : null}
    </div>
  )
}

function MobileMenu({
  sellerRegistered,
  buyerUnread,
  sellerUnread,
  notificationUnread,
  authenticated,
  onClose,
  onLogout,
}: {
  sellerRegistered: boolean
  buyerUnread: number
  sellerUnread: number
  notificationUnread: number
  authenticated: boolean
  onClose: () => void
  onLogout: () => void
}) {
  const t = useT()
  const { pathname } = useLocation()
  const [accountOpen, setAccountOpen] = useState(() => isAccountMenuPath(pathname))
  const [sellerOpen, setSellerOpen] = useState(() => isSellerMenuPath(pathname))

  useEffect(() => {
    if (isAccountMenuPath(pathname)) setAccountOpen(true)
    if (isSellerMenuPath(pathname)) setSellerOpen(true)
  }, [pathname])

  const badges = { buyer: buyerUnread, seller: sellerUnread, notify: notificationUnread }

  return (
    <div id="mobile-menu" className="border-t border-line px-4 py-2">
      <nav aria-label={t("nav.mobile")}>
        {navLinks.map((link) => (
          <MobileNavLink
            key={link.href}
            to={link.href}
            active={link.href.startsWith("/") && !link.href.includes("#") ? pathname === link.href : false}
            onClose={onClose}
          >
            {NAV_KEYS[link.href] ? t(NAV_KEYS[link.href]) : link.label}
          </MobileNavLink>
        ))}
      </nav>

      <div className="mt-1 border-t border-line pt-1">
        {authenticated ? (
          <>
            <MobileAccordion
              id="mobile-account-menu"
              label={t("account.navDashboard")}
              open={accountOpen}
              onToggle={() => setAccountOpen((value) => !value)}
            >
              {ACCOUNT_NAV_ITEMS.map((item) => (
                <MobileNavLink key={item.to} to={item.to} nested active={isMenuActive(pathname, item.to)} onClose={onClose}>
                  <span className="inline-flex items-center gap-2">
                    {t(item.label)}
                    {item.badge && badges[item.badge] ? <UnreadBadge count={badges[item.badge]} /> : null}
                  </span>
                </MobileNavLink>
              ))}
            </MobileAccordion>

            {sellerRegistered ? (
              <MobileAccordion
                id="mobile-seller-menu"
                label={t("seller.center")}
                open={sellerOpen}
                onToggle={() => setSellerOpen((value) => !value)}
              >
                {SELLER_NAV_ITEMS.map((item) => (
                    <MobileNavLink key={item.to} to={item.to} nested active={isMenuActive(pathname, item.to)} onClose={onClose}>
                      <span className="inline-flex items-center gap-2">
                        {t(item.label)}
                        {item.badge && badges[item.badge] ? <UnreadBadge count={badges[item.badge]} /> : null}
                      </span>
                    </MobileNavLink>
                  ))}
              </MobileAccordion>
            ) : (
              <MobileNavLink to="/seller/register" active={pathname === "/seller/register"} onClose={onClose}>
                {t("nav.becomeSeller")}
              </MobileNavLink>
            )}

            <MobileNavLink to="/settings" active={isMenuActive(pathname, "/settings")} onClose={onClose}>
              {t("account.navSettings")}
            </MobileNavLink>
            <button type="button" className={menuItemClass} onClick={onLogout}>
              {t("common.logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={menuItemClass} onClick={onClose}>
              {t("common.login")}
            </Link>
            <Link to="/signup" className={menuItemClass} onClick={onClose}>
              {t("common.signup")}
            </Link>
          </>
        )}
      </div>

      <div className="mt-1 border-t border-line pt-1">
        <LanguageSwitcher variant="list" />
      </div>
    </div>
  )
}

function AccountMenu({
  name,
  sellerRegistered,
  buyerUnread,
  sellerUnread,
  notificationUnread,
  onLogout,
}: {
  name: string
  sellerRegistered: boolean
  buyerUnread: number
  sellerUnread: number
  notificationUnread: number
  onLogout: () => void
}) {
  const t = useT()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const badges = { buyer: buyerUnread, seller: sellerUnread, notify: notificationUnread }

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("mousedown", handleClick)
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("mousedown", handleClick)
      window.removeEventListener("keydown", handleKey)
    }
  }, [])

  function itemClass(to: string) {
    return cn(
      "flex items-center justify-between gap-2 px-3 py-1.5 text-ui hover:bg-surface focus-visible:bg-surface focus-visible:outline-none",
      isMenuActive(pathname, to) && "bg-brand-soft font-medium text-brand",
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex h-10 shrink-0 items-center justify-center rounded-md p-1.5 text-navy hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={name}
        onClick={() => setOpen((value) => !value)}
      >
        <UserAvatar name={name} size="sm" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-line bg-white py-1.5 text-navy shadow-card">
          <p className="px-3 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-navy-muted">{t("account.sectionAccount")}</p>
          {ACCOUNT_NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              aria-current={isMenuActive(pathname, item.to) ? "page" : undefined}
              className={itemClass(item.to)}
              onClick={() => setOpen(false)}
            >
              <span>{t(item.label)}</span>
              {item.badge && badges[item.badge] ? <UnreadBadge count={badges[item.badge]} /> : null}
            </Link>
          ))}

          {sellerRegistered ? (
            <>
              <div className="my-1.5 border-t border-line" />
              <p className="px-3 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-navy-muted">{t("seller.center")}</p>
              {SELLER_NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  aria-current={isMenuActive(pathname, item.to) ? "page" : undefined}
                  className={itemClass(item.to)}
                  onClick={() => setOpen(false)}
                >
                  <span>{t(item.label)}</span>
                  {item.badge && badges[item.badge] ? <UnreadBadge count={badges[item.badge]} /> : null}
                </Link>
              ))}
            </>
          ) : (
            <>
              <div className="my-1.5 border-t border-line" />
              <Link
                to="/seller/register"
                role="menuitem"
                className={itemClass("/seller/register")}
                onClick={() => setOpen(false)}
              >
                {t("nav.becomeSeller")}
              </Link>
            </>
          )}

          <div className="my-1.5 border-t border-line" />
          <Link
            to="/settings"
            role="menuitem"
            aria-current={isMenuActive(pathname, "/settings") ? "page" : undefined}
            className={itemClass("/settings")}
            onClick={() => setOpen(false)}
          >
            {t("account.navSettings")}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-ui hover:bg-surface"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            {t("common.logout")}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function CartNavLink({ count, compact = false }: { count: number; compact?: boolean }) {
  const t = useT()
  const label = count > 0 ? `${t("nav.cart")} (${count})` : t("nav.cart")
  return (
    <Link
      to="/cart"
      aria-label={label}
      className={
        compact
          ? "relative flex size-11 items-center justify-center rounded-md text-brand hover:bg-brand-soft"
          : "relative flex h-10 shrink-0 items-center rounded-md p-1.5 text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      }
    >
      <ShoppingCart className="size-6" strokeWidth={1.75} />
      {count > 0 ? (
        <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-4 text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  )
}
