import { ChevronDown, Menu, Search, ShoppingCart, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
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
  "flex min-h-11 w-full items-center text-[15px] font-medium text-navy hover:text-brand"

const menuSecondaryClass =
  "flex min-h-10 w-full items-center text-[14px] font-medium text-navy hover:text-brand"

export function Header() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  useSellerLive()
  useChatLive()
  useNotificationsLive()
  const sellerProfile = user && isSellerProfilesReady() ? getSellerProfile(user.id) : null
  const sellerRegistered = Boolean(sellerProfile)
  const sellerApproved = sellerProfile?.status === "approved"
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
      <UtilityBar
        isAuthenticated={isAuthenticated}
        sellerHref={sellerHref}
        notificationUnread={notificationUnread}
        account={
          user ? (
            <AccountMenu
              name={displayName(user)}
              sellerRegistered={sellerRegistered}
              sellerApproved={sellerApproved}
              buyerUnread={buyerUnread}
              sellerUnread={sellerUnread}
              onLogout={handleLogout}
              compact
            />
          ) : null
        }
      />

      <div className="min-[769px]:hidden">
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
              className="flex size-11 items-center justify-center rounded-md text-navy hover:bg-brand-soft"
              aria-label={t("common.search")}
              onClick={focusMobileSearch}
            >
              <Search className="size-6" strokeWidth={1.75} />
            </button>
            <Link
              to="/orders"
              className="flex size-11 items-center justify-center rounded-md text-brand hover:bg-brand-soft"
              aria-label={t("nav.cart")}
            >
              <ShoppingCart className="size-6" strokeWidth={1.75} />
            </Link>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-md text-navy hover:bg-brand-soft"
              aria-expanded={open}
              aria-controls="mobile-menu"
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
          className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t("nav.brands")}
        >
          {searchQuickLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="shrink-0 whitespace-nowrap rounded-full bg-surface px-2.5 py-[6px] text-[13px] font-medium leading-none text-brand hover:text-brand-hover"
            >
              {QUICK_KEYS[link.label] ? t(QUICK_KEYS[link.label]) : link.label}
            </Link>
          ))}
        </nav>

        {open ? (
          <div id="mobile-menu" className="border-t border-line px-4 py-2">
            <nav aria-label={t("nav.mobile")}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={menuItemClass}
                  onClick={() => setOpen(false)}
                >
                  {NAV_KEYS[link.href] ? t(NAV_KEYS[link.href]) : link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-1 border-t border-line pt-1">
              {isAuthenticated && user ? (
                <>
                  <p className="px-0 py-2 text-[13px] font-semibold text-navy">{user.fullName}</p>
                  <Link to="/profile" className={menuItemClass} onClick={() => setOpen(false)}>
                    {t("nav.myProfile")}
                  </Link>
                  <Link to="/orders" className={menuItemClass} onClick={() => setOpen(false)}>
                    {t("nav.myOrders")}
                  </Link>
                  <Link to="/messages" className={menuItemClass} onClick={() => setOpen(false)}>
                    <span className="inline-flex items-center gap-2">
                      {t("common.messages")}
                      <UnreadBadge count={buyerUnread} />
                    </span>
                  </Link>
                  {sellerRegistered ? (
                    <>
                      <Link to="/seller/dashboard" className={menuItemClass} onClick={() => setOpen(false)}>
                        {t("nav.sellerDashboard")}
                      </Link>
                      {sellerApproved ? (
                        <Link to="/seller/listings" className={menuItemClass} onClick={() => setOpen(false)}>
                          {t("nav.listings")}
                        </Link>
                      ) : null}
                      <Link to="/seller/orders" className={menuItemClass} onClick={() => setOpen(false)}>
                        {t("nav.sellerOrders")}
                      </Link>
                      <Link to="/seller/messages" className={menuItemClass} onClick={() => setOpen(false)}>
                        <span className="inline-flex items-center gap-2">
                          {t("nav.sellerMessages")}
                          <UnreadBadge count={sellerUnread} />
                        </span>
                      </Link>
                      <Link to="/seller/profile" className={menuItemClass} onClick={() => setOpen(false)}>
                        {t("nav.sellerProfile")}
                      </Link>
                      {sellerApproved ? (
                        <Link to="/sell" className={menuItemClass} onClick={() => setOpen(false)}>
                          {t("nav.sellMotorcycle")}
                        </Link>
                      ) : null}
                    </>
                  ) : (
                    <Link to="/seller/register" className={menuItemClass} onClick={() => setOpen(false)}>
                      {t("nav.becomeSeller")}
                    </Link>
                  )}
                  <button type="button" className={menuItemClass} onClick={handleLogout}>
                    {t("common.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className={menuItemClass} onClick={() => setOpen(false)}>
                    {t("common.login")}
                  </Link>
                  <Link to="/signup" className={menuItemClass} onClick={() => setOpen(false)}>
                    {t("common.signup")}
                  </Link>
                </>
              )}
            </div>

            <div className="mt-1 border-t border-line pt-1">
              <Link to="/notifications" className={menuSecondaryClass} onClick={() => setOpen(false)}>
                <span className="inline-flex items-center gap-2">
                  {t("common.notifications")}
                  {notificationUnread > 0 ? <UnreadBadge count={notificationUnread} /> : null}
                </span>
              </Link>
              <Link to="/#help" className={menuSecondaryClass} onClick={() => setOpen(false)}>
                {t("nav.help")}
              </Link>
              <Link to={sellerHref} className={menuSecondaryClass} onClick={() => setOpen(false)}>
                {t("nav.sellerCentre")}
              </Link>
              <Link to="/sell" className={menuSecondaryClass} onClick={() => setOpen(false)}>
                {t("nav.startSelling")}
              </Link>
              <a href="/#app-store" className={menuSecondaryClass} onClick={() => setOpen(false)}>
                {t("nav.downloadApp")}
              </a>
              <LanguageSwitcher variant="list" />
            </div>
          </div>
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

          <Link
            to="/orders"
            className="flex h-10 shrink-0 items-center rounded-md p-1.5 text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={t("nav.cart")}
          >
            <ShoppingCart className="size-6" strokeWidth={1.75} />
          </Link>
        </div>
      </Container>
    </header>
  )
}

function AccountMenu({
  name,
  sellerRegistered,
  sellerApproved,
  buyerUnread,
  sellerUnread,
  onLogout,
  compact = false,
}: {
  name: string
  sellerRegistered: boolean
  sellerApproved: boolean
  buyerUnread: number
  sellerUnread: number
  onLogout: () => void
  compact?: boolean
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={
          compact
            ? "inline-flex max-w-[140px] items-center gap-1 truncate hover:text-white/80"
            : "inline-flex items-center gap-1.5 text-ui font-medium text-navy hover:text-brand"
        }
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {name}
        <ChevronDown className="size-3 shrink-0" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-line bg-white py-2 text-navy">
          <Link to="/profile" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
            {t("nav.myProfile")}
          </Link>
          <Link to="/orders" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
            {t("nav.myOrders")}
          </Link>
          <Link
            to="/messages"
            className="flex items-center justify-between gap-2 px-3 py-1.5 text-ui hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            <span>{t("common.messages")}</span>
            <UnreadBadge count={buyerUnread} />
          </Link>
          {sellerRegistered ? (
            <>
              <Link to="/seller/dashboard" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                {t("nav.sellerDashboard")}
              </Link>
              {sellerApproved ? (
                <Link to="/seller/listings" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                  {t("nav.listings")}
                </Link>
              ) : null}
              <Link to="/seller/orders" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                {t("nav.sellerOrders")}
              </Link>
              <Link
                to="/seller/messages"
                className="flex items-center justify-between gap-2 px-3 py-1.5 text-ui hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                <span>{t("nav.sellerMessages")}</span>
                <UnreadBadge count={sellerUnread} />
              </Link>
              <Link to="/seller/profile" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                {t("nav.sellerProfile")}
              </Link>
              {sellerApproved ? (
                <Link to="/sell" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
                  {t("nav.sellMotorcycle")}
                </Link>
              ) : null}
            </>
          ) : (
            <Link to="/seller/register" className="block px-3 py-1.5 text-ui hover:bg-surface" onClick={() => setOpen(false)}>
              {t("nav.becomeSeller")}
            </Link>
          )}
          <button
            type="button"
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
